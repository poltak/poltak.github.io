import { h, FunctionalComponent } from 'preact'
import PreactRouter from 'preact-router'

import { Home } from './pages/home'

export interface Props {}

export const Router: FunctionalComponent<Props> = props => (
    <PreactRouter>
        <Home path="/" />
    </PreactRouter>
)
