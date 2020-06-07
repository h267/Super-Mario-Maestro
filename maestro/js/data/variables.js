// TODO: Save as JSON files
/**
 * Data on the various scroll speeds in Mario Maker 2. Tempos are stored in their 4 block per beat equivalents.
 */

const levelWidth = 240;
const marginWidth = 27;
const levelHeight = 27;
const baseOfsY = 48;

const numBlockSubdivisions = 1;

const soundSubframesPerSecond = 200;
const setupErrorToleranceSeconds = 0.035;

const showSetupLogs = false;

const MM2Tempos = [
	{
		name: 'Slow Autoscroll',
		bpm: 28,
		isCommon: false,
		isBuildable: true
	},
	{
		name: 'Medium Autoscroll',
		bpm: 56,
		isCommon: true,
		isBuildable: true
	},
	{
		name: 'Walking',
		bpm: 84,
		isCommon: true,
		isBuildable: true
	},
	{
		name: 'Fast Autoscroll',
		bpm: 112,
		isCommon: true,
		isBuildable: true
	},
	{
		name: 'Fast Lava Lift',
		bpm: 140,
		isCommon: true,
		isBuildable: true
	},
	{
		name: 'Running',
		bpm: 168,
		isCommon: true,
		isBuildable: true
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

const defaultSetups = [
	{ offset: 0, structType: 0, usesSemisolid: false }
];

const semisolidDelay = -17; // This and redundant code will be removed if it turns out semisolids are not additive

// NOTE: Time units per block = (60/(4 * bpm)) * 200
// # of Blocks = (setup time units) / (tempo time units per block)
// Accuracy error in seconds = ( Abs(target fraction - actual fraction) * Time units per block ) / 200

const standardBuildSetups = [
	{ structType: 0, usesSemisolid: false, timeDelay: 0 }, // Default
	{ structType: 0, usesSemisolid: true, timeDelay: semisolidDelay }, // Default + Semisolid
	{ structType: 6, usesSemisolid: false, timeDelay: 39 }, // 1 Block Drop
	{ structType: 6, usesSemisolid: true, timeDelay: 39 + semisolidDelay }, // 1 Block Drop + Semisolid
	{ structType: 2, usesSemisolid: false, timeDelay: 166 }, // 1 Block Parachute
	{ structType: 2, usesSemisolid: true, timeDelay: 166 + semisolidDelay }, // 1 Block Parachute + Semisolid
	{ structType: 1, usesSemisolid: false, timeDelay: 56 }, // 2 Block Drop
	{ structType: 1, usesSemisolid: true, timeDelay: 56 + semisolidDelay }, // 2 Block Drop + Semisolid
	{ structType: 3, usesSemisolid: false, timeDelay: 301 }, // 2 Block Parachute
	{ structType: 3, usesSemisolid: true, timeDelay: 301 + semisolidDelay }, // 2 Block Parachute + Semisolid
	{ structType: 5, usesSemisolid: false, timeDelay: 72 }, // 3 Block Drop
	{ structType: 5, usesSemisolid: true, timeDelay: 72 + semisolidDelay }, // 3 Block Drop + Semisolid
	{ structType: 4, usesSemisolid: false, timeDelay: 434 }, // 3 Block Parachute
	{ structType: 4, usesSemisolid: true, timeDelay: 434 + semisolidDelay } // 3 Block Parachute + Semisolid
];

let numSetupsFound = 0;
let dispString = '';
MM2Tempos.forEach((thisTempo) => {
	let timePerBlock = (60 / (4 * thisTempo.bpm)) * 200;
	if (showSetupLogs) console.log(`${thisTempo.name}\n\n`);
	standardBuildSetups.forEach((setup) => {
		let setupBlocks = setup.timeDelay / timePerBlock;
		let frac = setupBlocks - Math.round(setupBlocks);
		let secondsError = (Math.abs(frac) * timePerBlock) / soundSubframesPerSecond;
		if (secondsError < setupErrorToleranceSeconds) {
			if (showSetupLogs) {
				console.log(`\nsetup: ${setup.structType}, semisolid: ${setup.usesSemisolid}`);
				console.log(`approx. ${Math.round(setupBlocks)} blocks`);
				console.log(`${setupBlocks} blocks`);
				console.log(`${secondsError} seconds of error`);
				numSetupsFound++;
			}
			if (thisTempo.setups === undefined) thisTempo.setups = [];
			thisTempo.setups.push({
				structType: setup.structType,
				usesSemisolid: setup.usesSemisolid,
				offset: -Math.round(setupBlocks)
			});
		}
	});
});
Object.freeze(MM2Tempos);

/**
 * Data on the entities in Maestro.
 */
const MM2Instruments = [
	{ // 2
		id: 'goomba',
		name: 'Goomba (Grand Piano)',
		octave: 1,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true,
		buildRules: {}
	},
	{ // 3
		id: 'buzzybeetle',
		name: 'Buzzy Shellmet (Detuned Bell)',
		octave: 1,
		isPowerup: false,
		isPercussion: false,
		isBuildable: false,
		buildRules: {}
	},
	{ // 4
		id: '1up',
		name: '1-Up (Synth Organ)',
		octave: 0,
		isPowerup: true,
		isPercussion: false,
		isBuildable: true,
		buildRules: {}
	},
	{ // 5
		id: 'spiketop',
		name: 'Spike Top (Harpsichord)',
		octave: 0,
		isPowerup: false,
		isPercussion: false,
		isBuildable: false,
		buildRules: {
			canFallNextToWall: false
		}
	},
	{ // 6
		id: 'sledgebro',
		name: 'Sledge Bro (Bass Guitar)',
		octave: -2,
		isPowerup: false,
		isPercussion: false,
		isBuildable: false,
		buildRules: {
			width: 2,
			height: 2
		}
	},
	{ // 7
		id: 'piranhaplant',
		name: 'Piranha Plant (Pizzicato Strings)',
		octave: 1,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true,
		buildRules: {
			canFallNextToWall: false
		}
	},
	{ // 8
		id: 'bobomb',
		name: 'Bob-Omb (Orchestra Hit)',
		octave: 0,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true,
		buildRules: {}
	},
	{ // 9
		id: 'spiny',
		name: 'Spiny Shellmet (Trumpet)',
		octave: 1,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true,
		buildRules: {}
	},
	{ // 10
		id: 'drybones',
		name: 'Dry Bones Shell (Flute)',
		octave: 2,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true,
		buildRules: {}
	},
	{ // 11
		id: 'mushroom',
		name: 'Mushroom (Square Wave)',
		octave: 1,
		isPowerup: true,
		isPercussion: false,
		isBuildable: true,
		buildRules: {}
	},
	{ // 12
		id: 'rottenmushroom',
		name: 'Rotten Mushroom (Low Synth)',
		octave: -2,
		isPowerup: true,
		isPercussion: false,
		isBuildable: true,
		buildRules: {
			canHaveSemisolid: false
		}
	},
	{ // 13
		id: 'greenbeachkoopa',
		name: 'Green Beach Koopa (Bark)',
		octave: 0,
		isPowerup: false,
		isPercussion: false,
		isBuildable: false,
		buildRules: {}
	},
	{ // 14
		id: 'montymole',
		name: 'Monty Mole (Banjo)',
		octave: 0,
		isPowerup: false,
		isPercussion: false,
		isBuildable: false,
		buildRules: {
			bounceHeight: 1,
			semiBounceHeight: 2
		}
	},
	{ // 15
		id: 'pswitch',
		name: 'P-Switch (Snare Drum)',
		octave: 0,
		isPowerup: false,
		isPercussion: true,
		isBuildable: true,
		buildRules: {
			canParachute: false,
			canVerticalStack: false
		}
	},
	{ // 16
		id: 'redbeachkoopa',
		name: 'Red Beach Koopa (Meow)',
		octave: 0,
		isPowerup: false,
		isPercussion: false,
		isBuildable: false,
		buildRules: {}
	},
	{ // 17
		id: 'bigmushroom',
		name: 'Big Mushroom (Shamisen)',
		octave: 0,
		isPowerup: true,
		isPercussion: false,
		isBuildable: false,
		buildRules: {
			width: 2,
			height: 2
		}
	},
	{ // 18
		id: 'billblaster',
		name: 'Bill Blaster (Timpani)',
		octave: 0,
		isPowerup: false,
		isPercussion: true,
		isBuildable: false,
		buildRules: {
			canVerticalStack: false,
			canParachute: false,
			bounceHeight: 3,
			semiBounceHeight: 4,
			height: 2
		}
	},
	{ // 19
		id: 'shoegoomba',
		name: 'Shoe Goomba (Low Accordion)',
		octave: -1,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true,
		buildRules: {}
	},
	{ // 20
		id: 'stilettogoomba',
		name: 'Stiletto Goomba (Accordion)',
		octave: 0,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true,
		buildRules: {}
	},
	{ // 21
		id: 'cannon',
		name: 'Cannon (Timbales)',
		octave: 0,
		isPowerup: false,
		isPercussion: true,
		isBuildable: true,
		buildRules: {
			canFallNextToWall: false,
			canParachute: false,
			canVerticalStack: false
		}
	},
	{ // 22
		id: 'chainchomp',
		name: 'Chain Chomp (Unchained) (Synth Piano)',
		octave: 0,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true,
		buildRules: {
			canHaveSemisolid: false
		}
	},
	{ // 23
		id: 'post',
		name: 'Chain Chomp Post (Wood Block)',
		octave: 0,
		isPowerup: false,
		isPercussion: true,
		isBuildable: false,
		buildRules: {}
	},
	{ // 24
		id: 'coin',
		name: 'Coin (Sleigh Bells)',
		octave: 0,
		isPowerup: false,
		isPercussion: true,
		isBuildable: false,
		buildRules: {}
	},
	{ // 25
		id: 'firepiranhaplant',
		name: 'Fire Piranha Plant (Legato Strings)',
		octave: 0,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true,
		buildRules: {
			canFallNextToWall: false
		}
	},
	{ // 26
		id: 'fireflower',
		name: 'Fire Flower (Recorder)',
		octave: 1,
		isPowerup: true,
		isPercussion: false,
		isBuildable: true,
		buildRules: {}
	},
	{ // 27
		id: 'goombrat',
		name: 'Goombrat (Honky-Tonk Piano)',
		octave: 1,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true,
		buildRules: {}
	},
	{ // 28
		id: 'greenkoopa',
		name: 'Green Koopa (Xylophone)',
		octave: 1,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true,
		buildRules: {}
	},
	{ // 29
		id: 'redkoopa',
		name: 'Red Koopa (Vibraphone)',
		octave: 1,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true,
		buildRules: {}
	},
	{ // 30
		id: 'hammerbro',
		name: 'Hammer Bro (Electric Guitar)',
		octave: 1,
		isPowerup: false,
		isPercussion: false,
		isBuildable: false,
		buildRules: {}
	},
	{ // 31
		id: 'magikoopa',
		name: 'Magikoopa (Synth Choir)',
		octave: 1,
		isPowerup: false,
		isPercussion: false,
		isBuildable: false,
		buildRules: {}
	},
	{ // 32
		id: 'muncher',
		name: 'Muncher (Synth Piano 2)',
		octave: 0,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true,
		buildRules: {
			canVerticalStack: false,
			canParachute: false
		}
	},
	{ // 33
		id: 'pow',
		name: 'POW Block (Kick Drum)',
		octave: 0,
		isPowerup: false,
		isPercussion: true,
		isBuildable: true,
		buildRules: {
			canVerticalStack: false,
			canParachute: false
		}
	},
	{ // 34
		id: 'spring',
		name: 'Trampoline (Crash Cymbal)',
		octave: 0,
		isPowerup: false,
		isPercussion: true,
		isBuildable: true,
		buildRules: {
			canVerticalStack: false,
			canParachute: false
		}
	},
	{ // 35
		id: 'sidewaysspring',
		name: 'Sideways Trampoline (Hi-Hat)',
		octave: 0,
		isPowerup: false,
		isPercussion: true,
		isBuildable: true,
		buildRules: {
			canVerticalStack: false,
			canParachute: false
		}
	},
	{ // 36
		id: 'star',
		name: 'Super Star (Music Box)',
		octave: 1,
		isPowerup: true,
		isPercussion: false,
		isBuildable: true,
		buildRules: {
			canHaveSemisolid: false,
			semiBounceHeight: 2
		}
	},
	{ // 37
		id: 'superball',
		name: 'Superball Flower (Organ)',
		octave: 1,
		isPowerup: true,
		isPercussion: false,
		isBuildable: true,
		buildRules: {}
	},
	{ // 38
		id: 'thwomp',
		name: 'Thwomp (Ethnic Drum)',
		octave: 0,
		isPowerup: false,
		isPercussion: true,
		isBuildable: false,
		buildRules: {
			width: 2,
			height: 2
		}
	},
	{ // 39
		id: 'wiggler',
		name: 'Wiggler (Tubular Bells)',
		octave: 1,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true,
		buildRules: {
			canHaveSemisolid: false
		}
	},
	{ // 40
		id: 'spike',
		name: 'Spike (Acoustic Bass Guitar)',
		octave: -2,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true,
		buildRules: {
			canFreeFall: false
		}
	},
	{ // 41
		id: 'spikeball',
		name: 'Spike Ball (Bass Drum)',
		octave: 0,
		isPowerup: false,
		isPercussion: true,
		isBuildable: false,
		buildRules: {}
	},
	{ // 42
		id: 'snowball',
		name: 'Snowball (Tom-Tom Drum)',
		octave: 0,
		isPowerup: false,
		isPercussion: true,
		isBuildable: false,
		buildRules: {}
	},
	{ // 43
		id: 'pokey',
		name: 'Pokey (Acoustic Guitar)',
		octave: 0,
		isPowerup: false,
		isPercussion: false,
		isBuildable: false,
		buildRules: {
			height: 2
		}
	},
	{ // 44
		id: 'snowpokey',
		name: 'Snow Pokey (Kazoo)',
		octave: 1,
		isPowerup: false,
		isPercussion: false,
		isBuildable: false,
		buildRules: {
			height: 2
		}
	},
	{ // 45
		id: 'sword',
		name: 'Master Sword (Synth Horn)',
		octave: 0,
		isPowerup: true,
		isPercussion: false,
		isBuildable: true,
		buildRules: {}
	},
	{ // 46
		id: 'acorn',
		name: 'Super Acorn (INSTRUMENT)',
		octave: 0,
		isPowerup: true,
		isPercussion: false,
		isBuildable: true,
		buildRules: {}
	},
	{ // 47
		id: 'mechakoopa',
		name: 'Mechakoopa (INSTRUMENT)',
		octave: 0,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true,
		buildRules: {}
	},
	{ // 48
		id: 'blasta',
		name: 'Mechakoopa (Blasta) (INSTRUMENT)',
		octave: 0,
		isPowerup: true,
		isPercussion: false,
		isBuildable: true,
		buildRules: {}
	},
	{ // 49
		id: 'zappa',
		name: 'Mechakoopa (Zappa) (INSTRUMENT)',
		octave: 0,
		isPowerup: false,
		isPercussion: false,
		isBuildable: true,
		buildRules: {}
	}
];

const stdBuildRules = {
	canFreeFall: true,
	canFallNextToWall: true,
	canParachute: true,
	canHaveSemisolid: true,
	canBeInCell: true,
	canVerticalStack: true,
	bounceHeight: 5,
	semiBounceHeight: 6,
	width: 1,
	height: 1
};

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
	'transfer',
	'forbid'
];
