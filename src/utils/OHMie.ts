import { Address } from '@graphprotocol/graph-ts'

import { Ohmie } from '../../generated/schema'

export function loadOrCreateOHMie(addres: Address ): Ohmie{
    let user = Ohmie.load(addres.toHex())
    if (user == null) {
      user = new Ohmie(addres.toHex())
      user.save()
    }
    return user as Ohmie
}