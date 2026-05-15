#!/usr/bin/env node
/**
 * Take a Playwright recording + emitted scripts and produce the final video.
 *
 * Usage:
 *   node build-video.js --videos-dir <dir> [--assets <dir>] <video-name>
 *
 * Example:
 *   node build-video.js --videos-dir docs/handbook/videos 01-intro
 *
 * Inputs (in <videos-dir>/<name>/):
 *   <name>.webm        — Playwright recording (silent)
 *   <name>.cues.json   — per-cue caption timeline (preferred)
 *   <name>.ssml.txt    — fallback single-blob narration
 *   <name>.clicks.json — click timestamps (optional)
 *   <name>.chapters.json — chapter metadata (optional)
 *   <name>.meta.json   — leadInMs etc (optional)
 *   <name>.vtt         — captions for soft-subs / burn-in (optional)
 *
 * Assets (in <assets-dir>, default <videos-dir>/_assets/):
 *   click.mp3          — click SFX, optional
 *   music-bg.mp3       — background music bed, optional
 *
 * Outputs:
 *   <name>.mp3         — TTS audio (mixed)
 *   <name>.mp4         — final video (audio + video + soft subs)
 *   <name>.thumb.png   — 16:9 thumbnail
 *
 * Required env: ELEVENLABS_API_KEY
 * Optional env: ELEVENLABS_VOICE_ID, ELEVENLABS_MODEL, VOICE,
 *               FFMPEG_PATH (defaults to "ffmpeg" on PATH),
 *               REGENERATE_AUDIO=1, SINGLE_BLOB=1, NO_CLICKS=1, NO_MUSIC=1
 *
 * Voice defaults: read from voices.json in the skill folder (one level up from
 * scripts/) if present, else built-in defaults below.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawn } = require('child_process');

function parseArgs(argv) {
    const args = { videosDir: null, assets: null, name: null };
    for (let i = 2; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--videos-dir') args.videosDir = argv[++i];
        else if (a === '--assets') args.assets = argv[++i];
        else if (a === '--help' || a === '-h') {
            console.log('Usage: build-video.js --videos-dir <dir> [--assets <dir>] <video-name>');
            console.log('Env: ELEVENLABS_API_KEY (required), VOICE, FFMPEG_PATH, REGENERATE_AUDIO=1');
            process.exit(0);
        }
        else if (!a.startsWith('--')) args.name = a;
    }
    if (!args.videosDir || !args.name) {
        console.error('Usage: build-video.js --videos-dir <dir> [--assets <dir>] <video-name>');
        process.exit(1);
    }
    args.videosDir = path.resolve(args.videosDir);
    args.assets = args.assets ? path.resolve(args.assets) : path.join(args.videosDir, '_assets');
    return args;
}

const ARGS = parseArgs(process.argv);
const NAME = ARGS.name;
const DIR = path.join(ARGS.videosDir, NAME);
const ASSETS = ARGS.assets;
const BASE = path.join(DIR, NAME);
const WEBM = `${BASE}.webm`;
const SSML = `${BASE}.ssml.txt`;
const CUES = `${BASE}.cues.json`;
const CLICKS = `${BASE}.clicks.json`;
const CHAPTERS = `${BASE}.chapters.json`;
const META = `${BASE}.meta.json`;
const VTT = `${BASE}.vtt`;
const NARR_MP3 = `${BASE}.narration.mp3`;
const MP3 = `${BASE}.mp3`;
const MP4 = `${BASE}.mp4`;
const THUMB = `${BASE}.thumb.png`;
const TMP = path.join(DIR, '_per_cue');
const CLICK_SFX = path.join(ASSETS, 'click.mp3');
const MUSIC_BED = path.join(ASSETS, 'music-bg.mp3');
const VIDEO_FADE_MS = 600;

if (!fs.existsSync(WEBM)) { console.error(`Missing: ${WEBM}`); process.exit(1); }

const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';

// Voice config: load from skill-folder voices.json, fall back to builtin defaults.
const VOICES_JSON_PATH = path.resolve(__dirname, '..', 'voices.json');
const BUILTIN_VOICES = {
    // Sensible ElevenLabs defaults. Override via voices.json at the skill root.
    // Default voice ids below are placeholder examples — replace with your own.
    default: { id: 'EXAVITQu4vr4xnSDxMaL', settings: { stability: 0.5, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true } },
};
let VOICES = BUILTIN_VOICES;
try {
    if (fs.existsSync(VOICES_JSON_PATH)) {
        VOICES = JSON.parse(fs.readFileSync(VOICES_JSON_PATH, 'utf8'));
    }
} catch (e) {
    console.warn(`Warning: failed to parse ${VOICES_JSON_PATH}: ${e.message}. Using built-in defaults.`);
}

const VOICE_KEY = (process.env.VOICE || 'default').toLowerCase();
const VOICE_DEFAULT = VOICES[VOICE_KEY] || VOICES.default || Object.values(VOICES)[0];
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || VOICE_DEFAULT.id;
const VOICE_SETTINGS = VOICE_DEFAULT.settings;
const MODEL = process.env.ELEVENLABS_MODEL || 'eleven_turbo_v2_5';

function generateTts(text) {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) return reject(new Error('ELEVENLABS_API_KEY not set'));
        const body = JSON.stringify({ text, model_id: MODEL, voice_settings: VOICE_SETTINGS });
        const req = https.request({
            hostname: 'api.elevenlabs.io',
            path: `/v1/text-to-speech/${VOICE_ID}`,
            method: 'POST',
            headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
        }, res => {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    return reject(new Error(`ElevenLabs ${res.statusCode}: ${Buffer.concat(chunks).toString().slice(0, 500)}`));
                }
                resolve(Buffer.concat(chunks));
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

function run(cmd, args, label) {
    return new Promise((resolve, reject) => {
        console.log(`  ${label}…`);
        const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
        let err = '';
        p.stderr.on('data', d => err += d);
        p.on('close', code => code === 0 ? resolve() : reject(new Error(`${label} failed (${code}): ${err.slice(-1500)}`)));
    });
}

function ffprobeDuration(file) {
    return new Promise((resolve, reject) => {
        const probe = path.dirname(FFMPEG) + path.sep + 'ffprobe' + (process.platform === 'win32' ? '.exe' : '');
        const probeBin = fs.existsSync(probe) ? probe : 'ffprobe';
        const p = spawn(probeBin, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file]);
        let out = '';
        p.stdout.on('data', d => out += d);
        p.on('close', code => code === 0 ? resolve(parseFloat(out.trim())) : reject(new Error('ffprobe failed')));
    });
}

async function generatePerCueAudio(cues) {
    fs.mkdirSync(TMP, { recursive: true });
    const cueFiles = [];
    const drifts = [];
    let assembledMs = 0;
    const concatLines = [];

    for (let i = 0; i < cues.length; i++) {
        const cue = cues[i];
        const cueFile = path.join(TMP, `cue-${String(i).padStart(3, '0')}.mp3`);
        if (!fs.existsSync(cueFile) || process.env.REGENERATE_AUDIO === '1') {
            const text = cue.ttsText || cue.text;
            const audio = await generateTts(text);
            fs.writeFileSync(cueFile, audio);
        }
        const ttsDurMs = (await ffprobeDuration(cueFile)) * 1000;
        cueFiles.push({ ...cue, cueFile, ttsDurMs });

        const targetMs = cue.tStart;
        const silenceNeededMs = Math.max(0, targetMs - assembledMs);
        if (silenceNeededMs > 30) {
            const silenceFile = path.join(TMP, `sil-${String(i).padStart(3, '0')}.mp3`);
            await run(FFMPEG, [
                '-y', '-f', 'lavfi', '-i', `anullsrc=r=44100:cl=mono`,
                '-t', (silenceNeededMs / 1000).toFixed(3),
                '-q:a', '9', '-acodec', 'libmp3lame', silenceFile,
            ], `silence ${i} (${(silenceNeededMs/1000).toFixed(2)}s)`);
            concatLines.push(`file '${silenceFile.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`);
            assembledMs += silenceNeededMs;
        }

        concatLines.push(`file '${cueFile.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`);
        const audioStartMs = assembledMs;
        const drift = audioStartMs - targetMs;
        drifts.push({ cue: i + 1, captionStart: targetMs, audioStart: audioStartMs, drift, ttsDurMs, captionDurMs: cue.tEnd - cue.tStart });
        assembledMs += ttsDurMs;
    }

    const listFile = path.join(TMP, 'concat.txt');
    fs.writeFileSync(listFile, concatLines.join('\n'));
    await run(FFMPEG, [
        '-y', '-f', 'concat', '-safe', '0', '-i', listFile,
        '-c:a', 'libmp3lame', '-b:a', '160k', MP3,
    ], 'concat per-cue audio');

    return drifts;
}

function reportDrifts(drifts) {
    console.log('\n  Sync report:');
    console.log('  cue | caption start | audio start | drift  | tts dur | caption dur | overrun');
    let maxOver = 0;
    for (const d of drifts) {
        const over = d.ttsDurMs - d.captionDurMs;
        if (over > maxOver) maxOver = over;
        const overStr = over > 0 ? `+${(over/1000).toFixed(2)}s` : `${(over/1000).toFixed(2)}s`;
        console.log(`  ${String(d.cue).padStart(3)} | ${(d.captionStart/1000).toFixed(2).padStart(11)}s | ${(d.audioStart/1000).toFixed(2).padStart(9)}s | ${(d.drift/1000).toFixed(2).padStart(5)}s | ${(d.ttsDurMs/1000).toFixed(2)}s   | ${(d.captionDurMs/1000).toFixed(2)}s       | ${overStr}`);
    }
    console.log('');
    if (maxOver > 500) {
        console.log(`  WARNING: TTS overruns its caption window by ${(maxOver/1000).toFixed(2)}s on at least one cue.`);
        console.log('  Either lengthen the visual ms in the spec, or shorten the caption text.\n');
    }
}

async function getDuration(file) { return await ffprobeDuration(file); }

async function mixFinalAudio(narrationMp3, clicks, targetDurSec) {
    const narrDur = await getDuration(narrationMp3);
    const totalDur = Math.max(narrDur + 0.5, targetDurSec || 0);
    const haveMusic = fs.existsSync(MUSIC_BED) && process.env.NO_MUSIC !== '1';
    const haveClicks = fs.existsSync(CLICK_SFX) && clicks && clicks.length > 0 && process.env.NO_CLICKS !== '1';

    if (!haveMusic && !haveClicks) {
        fs.copyFileSync(narrationMp3, MP3);
        return;
    }

    const inputs = ['-i', narrationMp3];
    const filterParts = [];
    filterParts.push(`[0:a]apad=whole_dur=${totalDur.toFixed(2)}[narr]`);
    let amixInputs = ['[narr]'];

    if (haveClicks) {
        for (let i = 0; i < clicks.length; i++) inputs.push('-i', CLICK_SFX);
        for (let i = 0; i < clicks.length; i++) {
            const idx = 1 + i;
            const delayMs = Math.max(0, clicks[i].tMs);
            filterParts.push(`[${idx}:a]adelay=${delayMs}|${delayMs},volume=0.45[c${i}]`);
        }
        const clickLabels = clicks.map((_, i) => `[c${i}]`).join('');
        filterParts.push(`${clickLabels}amix=inputs=${clicks.length}:dropout_transition=0,volume=1.0[clicks]`);
        amixInputs.push('[clicks]');
    }

    if (haveMusic) {
        const musicIdx = 1 + (haveClicks ? clicks.length : 0);
        inputs.push('-stream_loop', '-1', '-i', MUSIC_BED);
        filterParts.push(`[${musicIdx}:a]atrim=duration=${totalDur.toFixed(2)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=2,afade=t=out:st=${(totalDur - 1.5).toFixed(2)}:d=1.5,volume=1.6[music]`);
        amixInputs.push('[music]');
    }

    filterParts.push(`${amixInputs.join('')}amix=inputs=${amixInputs.length}:duration=longest:dropout_transition=0,alimiter=limit=0.95[final]`);
    const args = [
        '-y', ...inputs,
        '-filter_complex', filterParts.join(';'),
        '-map', '[final]',
        '-c:a', 'libmp3lame', '-b:a', '192k', MP3,
    ];
    await run(FFMPEG, args, `mix narration + ${haveClicks ? clicks.length + ' clicks' : 'no clicks'} + ${haveMusic ? 'music' : 'no music'}`);
}

(async () => {
    const usePerCue = fs.existsSync(CUES) && process.env.SINGLE_BLOB !== '1';
    if (!fs.existsSync(NARR_MP3) || process.env.REGENERATE_AUDIO === '1') {
        if (usePerCue) {
            const cues = JSON.parse(fs.readFileSync(CUES, 'utf8'));
            console.log(`  TTS: voice=${VOICE_ID} model=${MODEL} cues=${cues.length} (per-cue, calibrated silences)`);
            const drifts = await generatePerCueAudio(cues);
            reportDrifts(drifts);
            fs.renameSync(MP3, NARR_MP3);
        } else {
            if (!fs.existsSync(SSML)) { console.error(`Missing: ${SSML}`); process.exit(1); }
            const text = fs.readFileSync(SSML, 'utf8').trim();
            console.log(`  TTS: voice=${VOICE_ID} model=${MODEL} chars=${text.length} (single-blob)`);
            const audio = await generateTts(text);
            fs.writeFileSync(NARR_MP3, audio);
        }
        console.log(`  ${path.basename(NARR_MP3)} written (${(fs.statSync(NARR_MP3).size / 1024).toFixed(1)} KB)`);
    } else {
        console.log(`  ${path.basename(NARR_MP3)} already exists — skipping TTS (set REGENERATE_AUDIO=1 to redo)`);
    }

    const meta0 = fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, 'utf8')) : {};
    const leadIn0 = (meta0.leadInMs || 0) / 1000;
    const webmDur0 = await getDuration(WEBM);
    const targetDur = Math.max(0, webmDur0 - leadIn0);
    const clicks = fs.existsSync(CLICKS) ? JSON.parse(fs.readFileSync(CLICKS, 'utf8')) : [];
    await mixFinalAudio(NARR_MP3, clicks, targetDur);
    console.log(`  ${path.basename(MP3)} written (mixed: ${(fs.statSync(MP3).size / 1024).toFixed(1)} KB)`);

    const subFilter = fs.existsSync(VTT)
        ? `subtitles=filename='${VTT.replace(/\\/g, '/').replace(/:/g, '\\:')}':force_style='FontName=Segoe UI,FontSize=18,PrimaryColour=&HFFFFFF&,OutlineColour=&H80000000&,BorderStyle=3,Outline=0,Shadow=0,MarginV=40'`
        : null;

    const meta = fs.existsSync(META) ? JSON.parse(fs.readFileSync(META, 'utf8')) : {};
    const leadInSec = (meta.leadInMs || 0) / 1000;
    if (leadInSec > 0.05) console.log(`  trimming ${leadInSec.toFixed(2)}s lead-in from webm`);

    const videoDur = (await getDuration(WEBM)) - leadInSec;
    const audioDur = await getDuration(MP3);
    const totalDur = Math.min(videoDur, audioDur);
    const fadeStart = Math.max(0, totalDur - VIDEO_FADE_MS / 1000);

    let metadataArgs = [];
    if (fs.existsSync(CHAPTERS)) {
        const totalMs = Math.round(totalDur * 1000);
        const raw = JSON.parse(fs.readFileSync(CHAPTERS, 'utf8'));
        const chapters = raw.filter(c => Math.round(c.tMs) < totalMs - 100);
        if (chapters.length > 0) {
            const metaFile = path.join(DIR, '_chapters.txt');
            const lines = [';FFMETADATA1'];
            for (let i = 0; i < chapters.length; i++) {
                const start = Math.max(0, Math.round(chapters[i].tMs));
                const rawEnd = i + 1 < chapters.length ? Math.round(chapters[i + 1].tMs) : totalMs;
                const end = Math.min(totalMs, Math.max(start + 50, rawEnd));
                lines.push('[CHAPTER]', `TIMEBASE=1/1000`, `START=${start}`, `END=${end}`, `title=${chapters[i].label}`);
            }
            fs.writeFileSync(metaFile, lines.join('\n'));
            metadataArgs = ['-i', metaFile, '-map_metadata', '2', '-map_chapters', '2'];
        }
    }

    const args = [
        '-y',
        ...(leadInSec > 0.05 ? ['-ss', leadInSec.toFixed(3)] : []),
        '-i', WEBM,
        '-i', MP3,
        ...metadataArgs,
        '-map', '0:v:0',
        '-map', '1:a:0',
        '-vf', `fade=t=in:st=0:d=${VIDEO_FADE_MS/1000},fade=t=out:st=${fadeStart}:d=${VIDEO_FADE_MS/1000}`,
        '-af', `afade=t=in:st=0:d=${VIDEO_FADE_MS/1000},afade=t=out:st=${fadeStart}:d=${VIDEO_FADE_MS/1000}`,
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '160k',
        '-shortest', '-movflags', '+faststart',
        MP4,
    ];
    await run(FFMPEG, args, 'ffmpeg mux + fades + chapters');

    await run(FFMPEG, [
        '-y', '-i', WEBM,
        '-vf', `select='gte(n\\,90)',scale=1280:720`,
        '-vframes', '1', '-q:v', '2', THUMB,
    ], 'ffmpeg thumbnail');

    const stat = fs.statSync(MP4);
    console.log(`\n  ${path.basename(MP4)} written (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`  ${path.basename(THUMB)} written`);
})().catch(e => { console.error(e.message); process.exit(1); });
