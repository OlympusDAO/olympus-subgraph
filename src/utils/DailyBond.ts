import { BigDecimal, BigInt } from '@graphprotocol/graph-ts';

import { DailyBond, Token, Treasury } from '../../generated/schema'
import { dayFromTimestamp } from './Dates';

export function loadOrCreateDailyBond(timestamp: BigInt, treasury: Treasury, token: Token): DailyBond{
    let day_timestamp = dayFromTimestamp(timestamp)
    let id = day_timestamp+token.name
    let dailyBond = DailyBond.load(id)
    if (dailyBond == null) {
        dailyBond = new DailyBond(id)
        dailyBond.amount = new BigDecimal(new BigInt(0))
        dailyBond.treasury = treasury.id
        dailyBond.timestamp = BigInt.fromString(day_timestamp)
        dailyBond.token = token.id
        dailyBond.save()
    }
    return dailyBond as DailyBond
}

export function createDailyBondRecord(timestamp: BigInt, token: Token, amount: BigDecimal, treasury: Treasury): void{
    let dailyBond = loadOrCreateDailyBond(timestamp, treasury, token)
    dailyBond.amount = dailyBond.amount.plus(amount)
    dailyBond.save()
}