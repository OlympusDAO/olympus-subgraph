import { BigDecimal, BigInt } from '@graphprotocol/graph-ts';

import { Treasury } from '../../generated/schema'
import { TREASURY_ADDRESS } from './Constants'

export function loadOrCreateTreasury(): Treasury{
    let treasury = Treasury.load(TREASURY_ADDRESS)
    if (treasury == null) {
        treasury = new Treasury(TREASURY_ADDRESS)
        treasury.daiBondTotalDeposit = new BigDecimal(new BigInt(0))
        treasury.ohmDaiSlpTotalDeposit = new BigDecimal(new BigInt(0))
        treasury.daiBalance = new BigDecimal(new BigInt(0))
        treasury.ohmDaiSlpBalance = new BigDecimal(new BigInt(0))
        treasury.save()
    }
    return treasury as Treasury
}