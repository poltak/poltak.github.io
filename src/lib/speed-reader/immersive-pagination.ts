export type PageTurn = 'previous' | 'next'

interface PointerTurnInput {
    startX: number
    startY: number
    endX: number
    endY: number
    viewportLeft: number
    viewportWidth: number
}

export interface PageDragScrollInput {
    currentPage: number
    pageWidth: number
    viewportWidth: number
    contentWidth: number
    deltaX: number
}

const MIN_SWIPE_DISTANCE = 48
const MAX_TAP_MOVEMENT = 12

export function calculatePageCount(scrollWidth: number, viewportWidth: number): number {
    if (!Number.isFinite(scrollWidth) || !Number.isFinite(viewportWidth) || viewportWidth <= 0) {
        return 1
    }

    return Math.max(1, Math.ceil(scrollWidth / viewportWidth))
}

export function getPageDragScrollLeft({
    currentPage,
    pageWidth,
    viewportWidth,
    contentWidth,
    deltaX,
}: PageDragScrollInput): number {
    if (
        !Number.isFinite(currentPage) ||
        !Number.isFinite(pageWidth) ||
        !Number.isFinite(viewportWidth) ||
        !Number.isFinite(contentWidth) ||
        !Number.isFinite(deltaX) ||
        pageWidth <= 0 ||
        viewportWidth <= 0
    ) {
        return 0
    }

    const maxScrollLeft = Math.max(0, contentWidth - viewportWidth)
    const pageStart = Math.min(Math.max(0, currentPage * pageWidth), maxScrollLeft)
    return Math.min(maxScrollLeft, Math.max(0, pageStart - deltaX))
}

export function getPointerPageTurn({
    startX,
    startY,
    endX,
    endY,
    viewportLeft,
    viewportWidth,
}: PointerTurnInput): PageTurn | null {
    const horizontalDistance = endX - startX
    const verticalDistance = endY - startY
    const absoluteHorizontalDistance = Math.abs(horizontalDistance)
    const absoluteVerticalDistance = Math.abs(verticalDistance)

    if (
        absoluteHorizontalDistance >= MIN_SWIPE_DISTANCE &&
        absoluteHorizontalDistance > absoluteVerticalDistance
    ) {
        return horizontalDistance < 0 ? 'next' : 'previous'
    }

    if (
        absoluteHorizontalDistance > MAX_TAP_MOVEMENT ||
        absoluteVerticalDistance > MAX_TAP_MOVEMENT ||
        viewportWidth <= 0
    ) {
        return null
    }

    const midpoint = viewportLeft + viewportWidth / 2
    return endX >= midpoint ? 'next' : 'previous'
}

export function getKeyboardPageTurn(key: string, shiftKey = false): PageTurn | null {
    if (key === 'ArrowRight' || key === 'PageDown' || (key === ' ' && !shiftKey)) {
        return 'next'
    }

    if (key === 'ArrowLeft' || key === 'PageUp' || (key === ' ' && shiftKey)) {
        return 'previous'
    }

    return null
}
