const insPlayData = [
	{ file: 'goomba' },
	{ file: 'shellmet', baseNote: KEY_F3 },
	{ file: '1up' },
	{ file: 'spiketop' },
	{ file: 'sledgebro' },
	{ file: 'piranha' },
	{ file: 'bobomb' },
	{ file: 'spiny' },
	{ file: 'drybones', hasLongSustain: true },
	{ file: 'shroom' },
	{ file: 'rottenshroom' },
	{ file: 'bark', baseNote: KEY_F3 },
	{ file: 'mole' },
	{ file: 'pswitch' },
	{ file: 'meow', baseNote: KEY_F3 },
	{ file: 'bigshroom' },
	{ file: 'blaster' },
	{ file: 'boot' },
	{ file: 'stiletto' },
	{ file: 'cannon' },
	{ file: 'chomp' },
	{ file: 'post' },
	{ file: 'coin' },
	{ file: 'fireplant', hasLongSustain: true },
	{ file: 'flower' },
	{ file: 'goombrat' },
	{ file: 'greenkoopa' },
	{ file: 'redkoopa' },
	{ file: 'hammerbro', hasLongSustain: true },
	{ file: 'magikoopa' },
	{ file: 'muncher' },
	{ file: 'pow' },
	{ file: 'spring' },
	{ file: 'sidespring' },
	{ file: 'star' },
	{ file: 'superball' },
	{ file: 'thwomp' },
	{ file: 'wiggler' },
	{ file: 'spike', volumeOffset: 3 },
	{ file: 'spikeball' },
	{ file: 'snowball' },
	{ file: 'pokey' },
	{ file: 'snowpokey' },
	{ file: 'sword' },
	{ file: 'acorn' },
	{ file: 'mechakoopa', hasLongSustain: true },
	{ file: 'mechakoopa-blasta', hasLongSustain: true },
	{ file: 'mechakoopa-zappa', hasLongSustain: true }
];
const defaultInsPlayData = { file: 'goomba', baseNote: KEY_C4, volumeOffset: 0 };
const polyphonyCap = 2;

let schTime = 0;
let pos = 0;
let len = 0;
let notes = [];
let framesPerColumn = 0;
let isPlaying = false;
let endBound;
let outputBuffer;
let samplers = [];
let buffers = [];
let isContinuousPlayback = false;
let noteSchedule = new NoteSchedule();
let isRendering = false;
let isPlaybackInterrupted = false;

let restrictPitchRange = true;
