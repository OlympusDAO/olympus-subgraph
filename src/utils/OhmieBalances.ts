import { BigDecimal, BigInt, Address} from '@graphprotocol/graph-ts'
import { Ohmie, OhmieBalance } from '../../generated/schema'
import { dayFromTimestamp } from './Dates';

export function loadOrCreateOhmieBalance(ohmie: Ohmie, timestamp: BigInt): OhmieBalance{
    let day_timestamp = dayFromTimestamp(timestamp)
    let id = day_timestamp+ohmie.id

    let ohmieBalance = OhmieBalance.load(id)
    if (ohmieBalance == null) {
        ohmieBalance = new OhmieBalance(id)
        ohmieBalance.ohmie = ohmie.id
        ohmieBalance.timestamp = timestamp
        ohmieBalance.sohmBalance = BigDecimal.fromString("0")
        ohmieBalance.ohmBalance = BigDecimal.fromString("0")
        ohmieBalance.bondBalance = BigDecimal.fromString("0")
        ohmieBalance.dollarBalance = BigDecimal.fromString("0")
        ohmieBalance.outstandingBonds = BigDecimal.fromString("0")
        ohmieBalance.save()
    }
    return ohmieBalance as OhmieBalance
}

