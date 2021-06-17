import { Address, BigInt } from '@graphprotocol/graph-ts'
import { Ohmie } from '../../generated/schema'
import { OlympusERC20 } from '../../generated/DAIBondV1/OlympusERC20'
import { sOlympusERC20 } from '../../generated/DAIBondV1/sOlympusERC20'

import { OHM_ERC20_CONTRACT, SOHM_ERC20_CONTRACT } from '../utils/Constants'
import { loadOrCreateOhmieBalance } from './OhmieBalances'
import { toDecimal } from './Decimals'
import { getOHMUSDRate } from './Price'

export function loadOrCreateOHMie(addres: Address): Ohmie{
    let ohmie = Ohmie.load(addres.toHex())
    if (ohmie == null) {
        ohmie = new Ohmie(addres.toHex())
        ohmie.save()
    }
    return ohmie as Ohmie
}

export function updateOhmieBalance(ohmie: Ohmie, timestamp: BigInt): void{

    let balance = loadOrCreateOhmieBalance(ohmie, timestamp)

    let ohm_contract = OlympusERC20.bind(Address.fromString(OHM_ERC20_CONTRACT))
    let sohm_contract = sOlympusERC20.bind(Address.fromString(SOHM_ERC20_CONTRACT))

    balance.ohmBalance = toDecimal(ohm_contract.balanceOf(Address.fromString(ohmie.id)), 9)
    balance.sohmBalance = toDecimal(sohm_contract.balanceOf(Address.fromString(ohmie.id)), 9)

    let usdRate = getOHMUSDRate()
    balance.dollarBalance = balance.ohmBalance.times(usdRate).plus(balance.sohmBalance.times(usdRate))
    //TODO get pending bonding rewards 
    balance.save()

    ohmie.lastBalance = balance.id;
    ohmie.save()
}