import { Address } from '@graphprotocol/graph-ts'

import { OHMie } from '../../generated/schema'

export function loadOrCreateOHMie(addres: Address ): OHMie{
    let user = OHMie.load(addres.toHex())
    if (user == null) {
      user = new OHMie(addres.toHex())
      user.save()
    }
    return user as OHMie
}