/**
 * Socket event handler for poll updates
 */

const util = require('util');
const { fill, gradient } = require('../utils/pixelOps');
const { displayBoard, getStringColumnLength } = require('../utils/displayUtils');
const { player } = require('../utils/soundUtils');
const ws281x = require('rpi-ws281x-native');
const PIXELS_PER_LETTER = 5;

/**
 * Handle class update with poll data
 */
function handleClassUpdate() {
	return (classroomData) => {
		const { pixels, config, boardIntervals, pollData, timerData } = require('../state');
		const newPollData = classroomData.poll
		let pixelsPerStudent
		let text = ''
		let pollText = 'Poll'
		let pollResponses = 0
		let blind = newPollData.blind
		let specialDisplay = false

		if (util.isDeepStrictEqual(newPollData, pollData)) return

		if (!newPollData.status) {
			fill(pixels, 0x000000, 0, config.barPixels)

			let display = displayBoard(pixels, config.formbarUrl.split('://')[1], 0xFFFFFF, 0x000000, config, boardIntervals)
			if (display) {
				boardIntervals.push(display)
				ws281x.render()
			}

			let state = require('../state');
			state.pollData = newPollData
			return
		}

		const getResponsesArray = () => {
			if (Array.isArray(newPollData.responses)) {
				return newPollData.responses
			} else {
				return Object.values(newPollData.responses)
			}
		}

		const responsesArray = getResponsesArray()

		for (let poll of Object.values(newPollData.responses)) {
			pollResponses += poll.responses
		}

		if (newPollData.totalResponses === 6 && newPollData.totalResponders === 9) {
			player.play('./sfx/clicknice.wav')
		}

		if (newPollData.totalResponses === 6 && newPollData.totalResponders === 7) {
			player.play('./sfx/brainrot.wav')
		}

		if (newPollData.totalResponses === 4 && newPollData.totalResponders === 20) {
			player.play('./sfx/snoop.wav')
		}

		if (!timerData.active) {
			fill(pixels, 0x808080, 0, config.barPixels)

			for (let poll of Object.values(newPollData.responses)) {
				poll.color = parseInt(poll.color.slice(1), 16)
			}

			if (pollResponses == newPollData.totalResponders && pollResponses > 0 && !newPollData.multiRes) {
				blind = false

				if (newPollData.prompt == 'Thumbs?') {
					fill(pixels, 0x000000, config.barPixels)

					const findResponse = (answerText) => {
						return responsesArray.find(r => r.answer === answerText)
					}

					const upResponses = findResponse('Up')
					if (upResponses && upResponses.responses == newPollData.totalResponders) {
						gradient(pixels, 0x0000FF, 0xFF0000, 0, config.barPixels)
						let text = [
							'Skibidi Rizz!',
							'Max Gamer!'
						]
						let display = displayBoard(pixels, text[Math.floor(Math.random() * text.length)], 0x00FF00, 0x000000, config, boardIntervals)
						if (!display) return
						boardIntervals.push(display)
						player.play('./sfx/sfx_success01.wav')

						specialDisplay = true

						return
					}

					const wiggleResponse = findResponse('Wiggle')
					if (wiggleResponse && wiggleResponse.responses == newPollData.totalResponders) {
						player.play('./sfx/bruh.wav')

						let text = [
							'Wiggle Nation: Where democracy meets indecision!',
							'Wiggle-o-mania: The cure for decision-making paralysis!'
						]

						text = text[Math.floor(Math.random() * text.length)]

						let display = displayBoard(pixels, text, 0x00FFFF, 0x000000, config, boardIntervals)
						if (!display) return
						boardIntervals.push(display)

						specialDisplay = true
					}

					const downResponse = findResponse('Down')
					if (downResponse && downResponse.responses == newPollData.totalResponders) {
						player.play('./sfx/wompwomp.wav')
						let text = [
							'Git Gud',
							'Skill issue'
						]
						let display = displayBoard(pixels, text[Math.floor(Math.random() * text.length)], 0xFF0000, 0x000000, config, boardIntervals)
						if (!display) return
						boardIntervals.push(display)

						specialDisplay = true
					}
				}
			}

			let nonEmptyPolls = -1
			for (let poll of Object.values(newPollData.responses)) {
				if (poll.responses > 0) {
					nonEmptyPolls++
				}
			}

			let totalResponses = 0
			for (let poll of Object.values(newPollData.responses)) {
				totalResponses += poll.responses
			}

			if (newPollData.multiRes) {
				if (newPollData.totalResponders <= 0) pixelsPerStudent = 0
				else pixelsPerStudent = Math.ceil((config.barPixels - nonEmptyPolls) / totalResponses / newPollData.totalResponders)
			} else {
				if (newPollData.totalResponders <= 0) pixelsPerStudent = 0
				else pixelsPerStudent = Math.ceil((config.barPixels - nonEmptyPolls) / newPollData.totalResponders)
			}

			let currentPixel = 0
			let pollNumber = 0
			for (let poll of Object.values(newPollData.responses)) {
				for (let responseNumber = 0; responseNumber < poll.responses; responseNumber++) {
					let color = poll.color
					if (blind) color = 0xFF8000

					fill(pixels, color, currentPixel, pixelsPerStudent)
					currentPixel += pixelsPerStudent

					if (
						responseNumber < poll.responses - 1 ||
						pollNumber < nonEmptyPolls
					) {
						pixels[currentPixel] = 0xFF0080
					}
				}

				if (
					!blind &&
					poll.responses > 0
				) currentPixel++
				pollNumber++
			}
		}

		if (!specialDisplay) {
			text = `${newPollData.totalResponses}/${newPollData.totalResponders} `
			if (newPollData.prompt) pollText = newPollData.prompt

			fill(pixels, 0x000000, config.barPixels + getStringColumnLength(text + pollText) * 8)

			let display = displayBoard(pixels, text, 0xFFFFFF, 0x000000, config, boardIntervals)
			if (display) boardIntervals.push(display)

			display = displayBoard(pixels, pollText, 0xFFFFFF, 0x000000, config, boardIntervals, getStringColumnLength(text))
			if (display) boardIntervals.push(display)
		}

		let state = require('../state');
		state.pollData = newPollData

		ws281x.render()
	}
}

module.exports = {
	handleClassUpdate
};
