// TODO: Save as JSON files
/**
 * Data on the various scroll speeds in Mario Maker 2. Tempos are stored in their 4 block per beat equivalents.
 */

const numBlockSubdivisions = 2;

const MM2Tempos = [
	{
		name: 'Slow Autoscroll',
		bpm: 28,
		isCommon: false,
		isBuildable: true
	},
	{
		name: 'Backwards Normal Conveyor - Walking',
		bpm: 28,
		isCommon: false,
		isBuildable: false
	},
	{
		name: 'Underwater - Walking',
		bpm: 32,
		isCommon: false,
		isBuildable: false
	},
	{
		name: 'Normal Conveyor - Idle',
		bpm: 56,
		isCommon: false,
		isBuildable: false
	},
	{
		name: 'Medium Autoscroll',
		bpm: 56,
		isCommon: true,
		isBuildable: true
	},
	{
		name: 'Backwards Fast Conveyor - Running',
		bpm: 56,
		isCommon: false,
		isBuildable: false
	},
	{
		name: 'Swimming',
		bpm: 64,
		isCommon: false,
		isBuildable: false
	},
	{
		name: 'Walking',
		bpm: 84,
		isCommon: true,
		isBuildable: true
	},
	{
		name: 'Blaster in Cloud - Idle',
		bpm: 84,
		isCommon: false,
		isBuildable: false
	},
	{
		name: 'Normal Underwater Conveyor - Walking',
		bpm: 88,
		isCommon: false,
		isBuildable: false
	},
	{
		name: 'Swimming Holding Item',
		bpm: 101,
		isCommon: false,
		isBuildable: false
	},
	{
		name: 'Fast Autoscroll',
		bpm: 112,
		isCommon: true,
		isBuildable: true
	},
	{
		name: 'Backwards Normal Conveyor - Running',
		bpm: 112,
		isCommon: false,
		isBuildable: false
	},
	{
		name: 'Fast Conveyor - Idle',
		bpm: 112,
		isCommon: false,
		isBuildable: false
	},
	{
		name: 'Underwater Blaster in Cloud - Walking',
		bpm: 116,
		isCommon: false,
		isBuildable: false
	},
	{
		name: 'Normal Conveyor - Walking',
		bpm: 140,
		isCommon: false,
		isBuildable: false
	},
	{
		name: 'Fast Lava Lift',
		bpm: 140,
		isCommon: true,
		isBuildable: true
	},
	{
		name: 'Fast Underwater Conveyor - Walking',
		bpm: 144,
		isCommon: false,
		isBuildable: false
	},
	{
		name: 'Underwater Blaster in Cloud - Swimming',
		bpm: 148,
		isCommon: false,
		isBuildable: false
	},
	{
		name: 'Blaster in Cloud - Walking',
		bpm: 166,
		isCommon: false,
		isBuildable: false
	},
	{
		name: 'Running',
		bpm: 168,
		isCommon: true,
		isBuildable: true
	},
	{
		name: 'Underwater Blaster in Cloud - Swimming Holding Item',
		bpm: 186,
		isCommon: false,
		isBuildable: false
	},
	{
		name: 'Fast Conveyor - Walking',
		bpm: 194,
		isCommon: false,
		isBuildable: false
	},
	{
		name: 'Normal Conveyor - Running',
		bpm: 227,
		isCommon: false,
		isBuildable: false
	},
	{
		name: 'Blaster in Cloud - Running',
		bpm: 256,
		isCommon: false,
		isBuildable: false
	},
	{
		name: 'Fast Conveyor - Running',
		bpm: 279,
		isCommon: false,
		isBuildable: false
	}
];

/**
 * Data on the entities in Maestro.
 */
const MM2Instruments = [ // TODO: Switch to keys and move away from IDs
	{ // 2
		id: 'goomba',
		name: 'Goomba (Grand Piano)',
		octave: 1,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true
	},
	{ // 3
		id: 'buzzybeetle',
		name: 'Buzzy Shellmet (Detuned Bell)',
		octave: 1,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true
	},
	{ // 4
		id: '1up',
		name: '1-Up (Synth Organ)',
		octave: 0,
		isPowerup: true,
		isPercussion: false,
		isBuildable: true
	},
	{ // 5
		id: 'spiketop',
		name: 'Spike Top (Harpsichord)',
		octave: 0,
		isPowerup: false,
		isPercussion: false,
		isBuildable: false
	},
	{ // 6
		id: 'sledgebro',
		name: 'Sledge Bro (Bass Guitar)',
		octave: -2,
		isPowerup: false,
		isPercussion: false,
		isBuildable: false
	},
	{ // 7
		id: 'piranhaplant',
		name: 'Piranha Plant (Pizzicato Strings)',
		octave: 1,
		isPowerup: false,
		isPercussion: false,
		isBuildable: false
	},
	{ // 8
		id: 'bobomb',
		name: 'Bob-Omb (Orchestra Hit)',
		octave: 0,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true
	},
	{ // 9
		id: 'spiny',
		name: 'Spiny Shellmet (Trumpet)',
		octave: 1,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true
	},
	{ // 10
		id: 'drybones',
		name: 'Dry Bones Shell (Flute)',
		octave: 2,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true
	},
	{ // 11
		id: 'mushroom',
		name: 'Mushroom (Square Wave)',
		octave: 1,
		isPowerup: true,
		isPercussion: false,
		isBuildable: true
	},
	{ // 12
		id: 'rottenmushroom',
		name: 'Rotten Mushroom (Low Synth)',
		octave: -2,
		isPowerup: true,
		isPercussion: false,
		isBuildable: true
	},
	{ // 13
		id: 'greenbeachkoopa',
		name: 'Green Beach Koopa (Bark)',
		octave: 0,
		isPowerup: false,
		isPercussion: false,
		isBuildable: false
	},
	{ // 14
		id: 'montymole',
		name: 'Monty Mole (Banjo)',
		octave: 0,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true
	},
	{ // 15
		id: 'pswitch',
		name: 'P-Switch (Snare Drum)',
		octave: 0,
		isPowerup: false,
		isPercussion: true,
		isBuildable: false
	},
	{ // 16
		id: 'redbeachkoopa',
		name: 'Red Beach Koopa (Meow)',
		octave: 0,
		isPowerup: false,
		isPercussion: false,
		isBuildable: false
	},
	{ // 17
		id: 'bigmushroom',
		name: 'Big Mushroom (Shamisen)',
		octave: 0,
		isPowerup: true,
		isPercussion: false,
		isBuildable: false
	},
	{ // 18
		id: 'billblaster',
		name: 'Bill Blaster (Timpani)',
		octave: 0,
		isPowerup: false,
		isPercussion: true,
		isBuildable: false
	},
	{ // 19
		id: 'shoegoomba',
		name: 'Shoe Goomba (Low Accordion)',
		octave: -1,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true
	},
	{ // 20
		id: 'stilettogoomba',
		name: 'Stiletto Goomba (Accordion)',
		octave: 0,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true
	},
	{ // 21
		id: 'cannon',
		name: 'Cannon (Timbales)',
		octave: 0,
		isPowerup: false,
		isPercussion: true,
		isBuildable: false
	},
	{ // 22
		id: 'chainchomp',
		name: 'Chain Chomp (Unchained) (Synth Piano)',
		octave: 0,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true
	},
	{ // 23
		id: 'post',
		name: 'Chain Chomp Post (Wood Block)',
		octave: 0,
		isPowerup: false,
		isPercussion: true,
		isBuildable: false
	},
	{ // 24
		id: 'coin',
		name: 'Coin (Sleigh Bells)',
		octave: 0,
		isPowerup: false,
		isPercussion: true,
		isBuildable: false
	},
	{ // 25
		id: 'firepiranhaplant',
		name: 'Fire Piranha Plant (Legato Strings)',
		octave: 0,
		isPowerup: false,
		isPercussion: false,
		isBuildable: false
	},
	{ // 26
		id: 'fireflower',
		name: 'Fire Flower (Recorder)',
		octave: 1,
		isPowerup: true,
		isPercussion: false,
		isBuildable: true
	},
	{ // 27
		id: 'goombrat',
		name: 'Goombrat (Honky-Tonk Piano)',
		octave: 1,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true
	},
	{ // 28
		id: 'greenkoopa',
		name: 'Green Koopa (Xylophone)',
		octave: 1,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true
	},
	{ // 29
		id: 'redkoopa',
		name: 'Red Koopa (Vibraphone)',
		octave: 1,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true
	},
	{ // 30
		id: 'hammerbro',
		name: 'Hammer Bro (Electric Guitar)',
		octave: 1,
		isPowerup: false,
		isPercussion: false,
		isBuildable: false
	},
	{ // 31
		id: 'magikoopa',
		name: 'Magikoopa (Synth Choir)',
		octave: 1,
		isPowerup: false,
		isPercussion: false,
		isBuildable: false
	},
	{ // 32
		id: 'muncher',
		name: 'Muncher (Synth Piano 2)',
		octave: 0,
		isPowerup: false,
		isPercussion: false,
		isBuildable: false
	},
	{ // 33
		id: 'pow',
		name: 'POW Block (Kick Drum)',
		octave: 0,
		isPowerup: false,
		isPercussion: true,
		isBuildable: false
	},
	{ // 34
		id: 'spring',
		name: 'Trampoline (Crash Cymbal)',
		octave: 0,
		isPowerup: false,
		isPercussion: true,
		isBuildable: false
	},
	{ // 35
		id: 'sidewaysspring',
		name: 'Sideways Trampoline (Hi-Hat)',
		octave: 0,
		isPowerup: false,
		isPercussion: true,
		isBuildable: false
	},
	{ // 36
		id: 'star',
		name: 'Super Star (Music Box)',
		octave: 1,
		isPowerup: true,
		isPercussion: false,
		isBuildable: true
	},
	{ // 37
		id: 'superball',
		name: 'Superball Flower (Organ)',
		octave: 1,
		isPowerup: true,
		isPercussion: false,
		isBuildable: true
	},
	{ // 38
		id: 'thwomp',
		name: 'Thwomp (Ethnic Drum)',
		octave: 0,
		isPowerup: false,
		isPercussion: true,
		isBuildable: false
	},
	{ // 39
		id: 'wiggler',
		name: 'Wiggler (Tubular Bells)',
		octave: 1,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true
	},
	{ // 40
		id: 'spike',
		name: 'Spike (Acoustic Bass Guitar)',
		octave: -2,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true
	},
	{ // 41
		id: 'spikeball',
		name: 'Spike Ball (Bass Drum)',
		octave: 0,
		isPowerup: false,
		isPercussion: true,
		isBuildable: false
	},
	{ // 42
		id: 'snowball',
		name: 'Snowball (Tom-Tom Drum)',
		octave: 0,
		isPowerup: false,
		isPercussion: true,
		isBuildable: false
	},
	{ // 43
		id: 'pokey',
		name: 'Pokey (Acoustic Guitar)',
		octave: 0,
		isPowerup: false,
		isPercussion: false,
		isBuildable: false
	},
	{ // 44
		id: 'snowpokey',
		name: 'Snow Pokey (Kazoo)',
		octave: 1,
		isPowerup: false,
		isPercussion: false,
		isBuildable: false
	},
	{ // 45
		id: 'sword',
		name: 'Master Sword (Synth Horn)',
		octave: 0,
		isPowerup: true,
		isPercussion: false,
		isBuildable: true
	}
];

const MM2Tiles = { // TODO: Convert all tiles to this format maybe
	ground: {
		img: 'image object goes here',
		drawOfs: { x: 0, y: 0 }
	}
};

const toolIconFilenames = [
	'info',
	'zoom',
	'ruler',
	'add',
	'erase',
	'select',
	'transfer'
];

class MaestroTrack {
	constructor(midiTrk) {
		this.notes = [];
		this.octaveShift = 0;
		this.semitoneShift = 0;
		this.instrumentChanges = [];
		if (midiTrk.usedInstruments[0] !== undefined) this.instrumentChanges.push(midiTrk.usedInstruments[0]);
		this.hasVisibleNotes = false;
		this.numNotesOffscreen = { above: 0, below: 0 };
		this.label = midiTrk.label;
		this.hasPercussion = midiTrk.hasPercussion;
		this.isFromUser = false;
		if (midiTrk.isFromUser) this.isFromUser = true;

		if (midiTrk === null) return;
		midiTrk.notes.forEach((midiNote) => {
			this.notes.push(new MaestroNote(midiNote));
		});
	}
}

class MaestroNote {
	constructor(midiNote = null) {
		if (midiNote === null) return;
		this.pitch = midiNote.pitch;
		this.time = midiNote.time; // TODO: Store x coord at 4 bpb
		let insId;
		if (midiNote.channel !== 9) insId = getMM2Instrument(midiNote.instrument) - 2;
		else {
			insId = getPercussionInstrument(midiNote.instrument);
			this.pitch = 56;
		}
		this.instrument = insId;
	}
}
