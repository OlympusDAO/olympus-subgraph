import { Address } from '@graphprotocol/graph-ts'

import { Ohmie } from '../../generated/schema'

export function loadOrCreateOHMie(addres: Address ): Ohmie{
    let ohmie = Ohmie.load(addres.toHex())
    if (ohmie == null) {
        ohmie = new Ohmie(addres.toHex())
        ohmie.save()
    }
    return ohmie as Ohmie
}