export interface SpeechVoice {
    name: string
    lang: string
    default?: boolean
}

export interface SpeechUtterance {
    text: string
    voice?: SpeechVoice
    rate: number
    onEnd: () => void
    onError: (error: unknown) => void
}

/**
 * Small speech boundary. A local model can implement this contract later
 * without coupling the reader to browser SpeechSynthesis objects.
 */
export interface SpeechProvider {
    readonly supported: boolean
    getVoices(): SpeechVoice[]
    speak(utterance: SpeechUtterance): void
    pause(): void
    resume(): void
    cancel(): void
}

export type SpeechStatus = 'idle' | 'playing' | 'paused' | 'unsupported' | 'error'

export interface SpeechControllerState {
    status: SpeechStatus
    chapterIndex: number
    voiceName: string
    rate: number
    errorMessage: string | null
}

export interface SpeechControllerOptions {
    onStateChange?: (state: SpeechControllerState) => void
    onChapterChange?: (chapterIndex: number) => void
    onComplete?: () => void
}

export interface SpeechChapter {
    title: string
    content: string
}

const MIN_RATE = 0.5
const MAX_RATE = 2
const MAX_UTTERANCE_LENGTH = 1500

export function clampSpeechRate(rate: number): number {
    if (!Number.isFinite(rate)) return 1
    return Math.min(MAX_RATE, Math.max(MIN_RATE, rate))
}

export function splitSpeechText(text: string, maxLength = MAX_UTTERANCE_LENGTH): string[] {
    const normalized = text.replace(/\s+/g, ' ').trim()
    if (!normalized) return []

    const safeMaxLength = Math.max(1, Math.trunc(maxLength))
    const chunks: string[] = []
    let current = ''

    for (const word of normalized.split(' ')) {
        if (word.length > safeMaxLength) {
            if (current) {
                chunks.push(current)
                current = ''
            }
            for (let offset = 0; offset < word.length; offset += safeMaxLength) {
                chunks.push(word.slice(offset, offset + safeMaxLength))
            }
            continue
        }

        const next = current ? `${current} ${word}` : word
        if (next.length <= safeMaxLength) {
            current = next
        } else {
            chunks.push(current)
            current = word
        }
    }

    if (current) chunks.push(current)
    return chunks
}

export class SpeechController {
    private provider: SpeechProvider
    private readonly onStateChange?: SpeechControllerOptions['onStateChange']
    private readonly onChapterChange?: SpeechControllerOptions['onChapterChange']
    private readonly onComplete?: SpeechControllerOptions['onComplete']
    private chapters: SpeechChapter[] = []
    private currentChunks: string[] = []
    private currentChunkIndex = 0
    private generation = 0
    private state: SpeechControllerState

    constructor(provider: SpeechProvider, options: SpeechControllerOptions = {}) {
        this.provider = provider
        this.onStateChange = options.onStateChange
        this.onChapterChange = options.onChapterChange
        this.onComplete = options.onComplete
        this.state = {
            status: provider.supported ? 'idle' : 'unsupported',
            chapterIndex: 0,
            voiceName: '',
            rate: 1,
            errorMessage: provider.supported
                ? null
                : 'Text to speech is not supported in this browser.',
        }
    }

    getState(): SpeechControllerState {
        return { ...this.state }
    }

    getVoices(): SpeechVoice[] {
        return this.provider.getVoices()
    }

    setBook(chapters: SpeechChapter[]): void {
        this.stop()
        this.chapters = chapters
        this.state.chapterIndex = 0
        this.notify()
    }

    selectChapter(chapterIndex: number): void {
        const nextIndex = this.clampChapterIndex(chapterIndex)
        if (nextIndex === this.state.chapterIndex) return

        if (this.state.status === 'playing' || this.state.status === 'paused') {
            this.stop()
        }

        this.state.chapterIndex = nextIndex
        this.notify()
    }

    setVoice(voiceName: string): void {
        this.state.voiceName = voiceName
        this.notify()
    }

    setRate(rate: number): void {
        this.state.rate = clampSpeechRate(rate)
        if (this.state.status === 'playing') {
            this.provider.cancel()
            this.startCurrentChapter()
            return
        }
        this.notify()
    }

    play(chapterIndex = this.state.chapterIndex): void {
        if (!this.provider.supported) {
            this.state.status = 'unsupported'
            this.state.errorMessage = 'Text to speech is not supported in this browser.'
            this.notify()
            return
        }

        if (this.chapters.length === 0) return

        this.state.chapterIndex = this.clampChapterIndex(chapterIndex)
        this.provider.cancel()
        this.startCurrentChapter()
    }

    pause(): void {
        if (this.state.status !== 'playing') return
        this.provider.pause()
        this.state.status = 'paused'
        this.notify()
    }

    resume(): void {
        if (this.state.status !== 'paused') return
        this.provider.resume()
        this.state.status = 'playing'
        this.state.errorMessage = null
        this.notify()
    }

    stop(): void {
        this.generation += 1
        this.provider.cancel()

        if (
            this.state.status === 'playing' ||
            this.state.status === 'paused' ||
            this.state.status === 'error'
        ) {
            this.state.status = this.provider.supported ? 'idle' : 'unsupported'
            this.state.errorMessage = this.provider.supported
                ? null
                : 'Text to speech is not supported in this browser.'
            this.notify()
        }
    }

    cleanup(): void {
        this.stop()
    }

    private startCurrentChapter(): void {
        const chapter = this.chapters[this.state.chapterIndex]
        if (!chapter || !this.provider.supported) return

        this.currentChunks = splitSpeechText(chapter.content)
        this.currentChunkIndex = 0
        if (this.currentChunks.length === 0) {
            this.advanceAfterChapter()
            return
        }

        this.speakCurrentChunk()
    }

    private speakCurrentChunk(): void {
        const text = this.currentChunks[this.currentChunkIndex]
        if (!text) return

        const generation = ++this.generation
        const voice = this.provider
            .getVoices()
            .find((candidate) => candidate.name === this.state.voiceName)

        this.state.status = 'playing'
        this.state.errorMessage = null
        this.notify()

        this.provider.speak({
            text,
            voice,
            rate: this.state.rate,
            onEnd: () => {
                if (generation !== this.generation) return

                if (this.currentChunkIndex + 1 < this.currentChunks.length) {
                    this.currentChunkIndex += 1
                    this.speakCurrentChunk()
                    return
                }
                this.advanceAfterChapter()
            },
            onError: (error) => {
                if (generation !== this.generation) return
                this.state.status = 'error'
                this.state.errorMessage =
                    error instanceof Error ? error.message : 'Text to speech failed.'
                this.notify()
            },
        })
    }

    private advanceAfterChapter(): void {
        const nextChapterIndex = this.state.chapterIndex + 1
        if (nextChapterIndex < this.chapters.length) {
            this.state.chapterIndex = nextChapterIndex
            this.onChapterChange?.(nextChapterIndex)
            this.startCurrentChapter()
            return
        }

        this.state.status = 'idle'
        this.notify()
        this.onComplete?.()
    }

    private clampChapterIndex(chapterIndex: number): number {
        if (this.chapters.length === 0 || !Number.isFinite(chapterIndex)) return 0
        return Math.min(Math.max(0, Math.trunc(chapterIndex)), this.chapters.length - 1)
    }

    private notify(): void {
        this.onStateChange?.(this.getState())
    }
}

interface SpeechSynthesisLike {
    speak(utterance: SpeechSynthesisUtterance): void
    pause(): void
    resume(): void
    cancel(): void
    getVoices(): SpeechSynthesisVoice[]
}

export function createBrowserSpeechProvider(
    synthesis: SpeechSynthesisLike | undefined = typeof window !== 'undefined'
        ? window.speechSynthesis
        : undefined,
    UtteranceConstructor:
        typeof SpeechSynthesisUtterance | undefined = typeof SpeechSynthesisUtterance !==
    'undefined'
        ? SpeechSynthesisUtterance
        : undefined,
): SpeechProvider {
    const supported = Boolean(synthesis && UtteranceConstructor)

    return {
        supported,
        getVoices: () =>
            supported
                ? synthesis!.getVoices().map((voice) => ({
                      name: voice.name,
                      lang: voice.lang,
                      default: voice.default,
                  }))
                : [],
        speak: ({ text, voice, rate, onEnd, onError }) => {
            if (!supported) {
                onError(new Error('Text to speech is not supported in this browser.'))
                return
            }

            const utterance = new UtteranceConstructor!(text)
            utterance.rate = clampSpeechRate(rate)
            if (voice) {
                const browserVoice = synthesis!
                    .getVoices()
                    .find((candidate) => candidate.name === voice.name)
                if (browserVoice) utterance.voice = browserVoice
            }
            utterance.onend = onEnd
            utterance.onerror = onError
            synthesis!.speak(utterance)
        },
        pause: () => synthesis?.pause(),
        resume: () => synthesis?.resume(),
        cancel: () => synthesis?.cancel(),
    }
}
