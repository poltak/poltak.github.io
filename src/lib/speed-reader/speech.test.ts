import { describe, expect, it, vi } from 'vitest'
import {
    SpeechController,
    dedupeSpeechVoices,
    splitSpeechText,
    type SpeechProvider,
    type SpeechUtterance,
    type SpeechVoice,
} from './speech'

class FakeSpeechProvider implements SpeechProvider {
    supported = true
    voices: SpeechVoice[] = [
        { name: 'Default', lang: 'en-US', default: true },
        { name: 'Reader', lang: 'en-GB' },
    ]
    utterances: SpeechUtterance[] = []
    pause = vi.fn()
    resume = vi.fn()
    cancel = vi.fn()

    getVoices() {
        return this.voices
    }

    speak(utterance: SpeechUtterance) {
        this.utterances.push(utterance)
    }
}

describe('SpeechController', () => {
    it('keeps the first voice when browser voice names repeat', () => {
        const firstHindiVoice = { name: 'Hindi India', lang: 'hi-IN' }

        expect(
            dedupeSpeechVoices([
                firstHindiVoice,
                { name: 'Hindi India', lang: 'hi-IN', default: true },
                { name: 'Reader', lang: 'en-GB' },
            ]),
        ).toEqual([firstHindiVoice, { name: 'Reader', lang: 'en-GB' }])
    })

    it('splits long text into bounded utterances', () => {
        const chunks = splitSpeechText('one two three four five', 8)

        expect(chunks).toEqual(['one two', 'three', 'four', 'five'])
        expect(chunks.every((chunk) => chunk.length <= 8)).toBe(true)
    })

    it('finishes every chunk before continuing to the next chapter', () => {
        const provider = new FakeSpeechProvider()
        const onChapterChange = vi.fn()
        const controller = new SpeechController(provider, { onChapterChange })
        controller.setBook([
            { title: 'Long', content: 'word '.repeat(400) },
            { title: 'Next', content: 'Next chapter' },
        ])

        controller.play()
        expect(provider.utterances[0].text.length).toBeLessThanOrEqual(1500)
        provider.utterances[0].onEnd()
        expect(provider.utterances[1].text.length).toBeLessThanOrEqual(1500)
        expect(onChapterChange).not.toHaveBeenCalled()
        provider.utterances[1].onEnd()
        expect(onChapterChange).toHaveBeenCalledWith(1)
        expect(provider.utterances[2].text).toBe('Next chapter')
    })

    it('continues with the next chapter and completes', () => {
        const provider = new FakeSpeechProvider()
        const onChapterChange = vi.fn()
        const onComplete = vi.fn()
        const controller = new SpeechController(provider, { onChapterChange, onComplete })
        controller.setBook([
            { title: 'One', content: 'First chapter' },
            { title: 'Two', content: 'Second chapter' },
        ])

        controller.play()
        expect(provider.utterances[0].text).toBe('First chapter')
        expect(controller.getState().status).toBe('playing')

        provider.utterances[0].onEnd()
        expect(onChapterChange).toHaveBeenCalledWith(1)
        expect(provider.utterances[1].text).toBe('Second chapter')

        provider.utterances[1].onEnd()
        expect(controller.getState().status).toBe('idle')
        expect(onComplete).toHaveBeenCalledOnce()
    })

    it('supports pause, resume, voice selection, and bounded rate', () => {
        const provider = new FakeSpeechProvider()
        const controller = new SpeechController(provider)
        controller.setBook([{ title: 'One', content: 'Text' }])
        controller.setVoice('Reader')
        controller.setRate(100)
        controller.play()

        expect(provider.utterances[0].voice?.name).toBe('Reader')
        expect(controller.getState().rate).toBe(2)

        controller.pause()
        expect(controller.getState().status).toBe('paused')
        controller.resume()
        expect(controller.getState().status).toBe('playing')
        expect(provider.pause).toHaveBeenCalledOnce()
        expect(provider.resume).toHaveBeenCalledOnce()
    })

    it('ignores callbacks from cancelled speech', () => {
        const provider = new FakeSpeechProvider()
        const controller = new SpeechController(provider)
        controller.setBook([
            { title: 'One', content: 'First' },
            { title: 'Two', content: 'Second' },
        ])
        controller.play()
        const staleUtterance = provider.utterances[0]

        controller.stop()
        staleUtterance.onEnd()

        expect(provider.utterances).toHaveLength(1)
        expect(controller.getState().status).toBe('idle')
    })

    it('reports unsupported providers without calling speech methods', () => {
        const provider = new FakeSpeechProvider()
        provider.supported = false
        const controller = new SpeechController(provider)
        controller.setBook([{ title: 'One', content: 'Text' }])
        controller.play()

        expect(controller.getState().status).toBe('unsupported')
        expect(provider.utterances).toHaveLength(0)
    })
})
