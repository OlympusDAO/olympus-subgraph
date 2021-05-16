import { Address } from '@graphprotocol/graph-ts'
import { BigDecimal, BigInt } from '@graphprotocol/graph-ts';

import { Ohmie } from '../../generated/schema'

export function loadOrCreateOHMie(addres: Address): Ohmie{
    let ohmie = Ohmie.load(addres.toHex())
    if (ohmie == null) {
        ohmie = new Ohmie(addres.toHex())
        ohmie.daiBondTotalDeposit = new BigDecimal(new BigInt(0))
        ohmie.ohmDaiSlpTotalDeposit = new BigDecimal(new BigInt(0))
        ohmie.save()
    }
    return ohmie as Ohmie
}