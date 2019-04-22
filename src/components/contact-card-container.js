import React from 'react'

import { useContactData } from './use-contact-data'
import { ContactCard as Card } from './contact-card'

export const ContactCard = props => <Card {...useContactData()} {...props} />
