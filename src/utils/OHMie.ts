import { Address } from '@graphprotocol/graph-ts'
import { BigDecimal, BigInt } from '@graphprotocol/graph-ts';

import { Ohmie } from '../../generated/schema'
import { loadOrCreateTreasury } from './Treasuries';

export function loadOrCreateOHMie(addres: Address): Ohmie{
    let ohmie = Ohmie.load(addres.toHex())
    let treasury = loadOrCreateTreasury()
    let tohmies = treasury.ohmies
    tohmies.push(addres.toHex())
    treasury.ohmies = tohmies
    treasury.save()
    
    if (ohmie == null) {
        ohmie = new Ohmie(addres.toHex())
        ohmie.daiBondTotalDeposit = BigDecimal.fromString("0")
        ohmie.ohmDaiSlpTotalDeposit = BigDecimal.fromString("0")
        ohmie.ohmBalance = BigDecimal.fromString("0")
        ohmie.sohmBalance = BigDecimal.fromString("0")
        ohmie.treasury = treasury.id
        ohmie.stakedRewards = BigDecimal.fromString("0")
        ohmie.save()
    }
    return ohmie as Ohmie
}