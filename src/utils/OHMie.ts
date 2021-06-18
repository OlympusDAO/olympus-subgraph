import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { Ohmie, Transaction } from '../../generated/schema'
import { OlympusERC20 } from '../../generated/DAIBondV1/OlympusERC20'
import { sOlympusERC20 } from '../../generated/DAIBondV1/sOlympusERC20'
import { DAIBondV1 } from '../../generated/DAIBondV1/DAIBondV1'
import { DAIBondV2 } from '../../generated/DAIBondV1/DAIBondV2'
import { OHMDAIBondV1 } from '../../generated/DAIBondV1/OHMDAIBondV1'
import { OHMDAIBondV2 } from '../../generated/DAIBondV1/OHMDAIBondV2'
import { OHMFRAXBondV1 } from '../../generated/DAIBondV1/OHMFRAXBondV1'

import { DAIBOND_CONTRACTS1, DAIBOND_CONTRACTS1_BLOCK, DAIBOND_CONTRACTS2, DAIBOND_CONTRACTS2_BLOCK, OHMDAISLPBOND_CONTRACT1, OHMDAISLPBOND_CONTRACT1_BLOCK, OHMDAISLPBOND_CONTRACT2, OHMDAISLPBOND_CONTRACT2_BLOCK, OHMFRAXLPBOND_CONTRACT1, OHMFRAXLPBOND_CONTRACT1_BLOCK, OHM_ERC20_CONTRACT, SOHM_ERC20_CONTRACT } from '../utils/Constants'
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

export function updateOhmieBalance(ohmie: Ohmie, transaction: Transaction): void{

    let balance = loadOrCreateOhmieBalance(ohmie, transaction.timestamp)

    let ohm_contract = OlympusERC20.bind(Address.fromString(OHM_ERC20_CONTRACT))
    let sohm_contract = sOlympusERC20.bind(Address.fromString(SOHM_ERC20_CONTRACT))

    var outstandingBonds = BigDecimal.fromString("0")

    if(transaction.blockNumber.ge(BigInt.fromString(DAIBOND_CONTRACTS1_BLOCK))){
        let db1_contract = DAIBondV1.bind(Address.fromString(DAIBOND_CONTRACTS1))
        let info = db1_contract.try_depositorInfo(Address.fromString(ohmie.id))
        if (!info.reverted){
            outstandingBonds = outstandingBonds.plus(new BigDecimal(info.value.value1))
        }
    }
    if(transaction.blockNumber.ge(BigInt.fromString(DAIBOND_CONTRACTS2_BLOCK))){
        let db2_contract = DAIBondV2.bind(Address.fromString(DAIBOND_CONTRACTS2))
        let info = db2_contract.try_pendingPayoutFor(Address.fromString(ohmie.id))
        if (!info.reverted){
            outstandingBonds = outstandingBonds.plus(new BigDecimal(info.value))
        }
    }
    if(transaction.blockNumber.ge(BigInt.fromString(OHMDAISLPBOND_CONTRACT1_BLOCK))){
        let od1_contract = OHMDAIBondV1.bind(Address.fromString(OHMDAISLPBOND_CONTRACT1))
        let info = od1_contract.try_depositorInfo(Address.fromString(ohmie.id))
        if (!info.reverted){
            outstandingBonds = outstandingBonds.plus(new BigDecimal(info.value.value1))
        }
    }
    if(transaction.blockNumber.ge(BigInt.fromString(OHMDAISLPBOND_CONTRACT2_BLOCK))){
        let od2_contract = OHMDAIBondV2.bind(Address.fromString(OHMDAISLPBOND_CONTRACT2))
        let info = od2_contract.try_pendingPayoutFor(Address.fromString(ohmie.id))
        if (!info.reverted){
            outstandingBonds = outstandingBonds.plus(new BigDecimal(info.value))
        }
    }
    if(transaction.blockNumber.ge(BigInt.fromString(OHMFRAXLPBOND_CONTRACT1_BLOCK))){
        let of1_contract = OHMFRAXBondV1.bind(Address.fromString(OHMFRAXLPBOND_CONTRACT1))
        let info = of1_contract.try_pendingPayoutFor(Address.fromString(ohmie.id))
        if (!info.reverted){
            outstandingBonds = outstandingBonds.plus(new BigDecimal(info.value))
        }
    }

    balance.ohmBalance = toDecimal(ohm_contract.balanceOf(Address.fromString(ohmie.id)), 9)
    balance.sohmBalance = toDecimal(sohm_contract.balanceOf(Address.fromString(ohmie.id)), 9)
    balance.outstandingBonds = outstandingBonds;

    let usdRate = getOHMUSDRate()
    balance.dollarBalance = balance.ohmBalance.times(usdRate).plus(balance.sohmBalance.times(usdRate))
    //TODO get pending bonding rewards 
    balance.save()

    ohmie.lastBalance = balance.id;
    ohmie.save()
}