import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { Ohmie, Transaction } from '../../generated/schema'
import { OlympusERC20 } from '../../generated/DAIBondV1/OlympusERC20'
import { sOlympusERC20 } from '../../generated/DAIBondV1/sOlympusERC20'
import { sOlympusERC20V2 } from '../../generated/DAIBondV1/sOlympusERC20V2'
import { DAIBondV1 } from '../../generated/DAIBondV1/DAIBondV1'
import { DAIBondV2 } from '../../generated/DAIBondV1/DAIBondV2'
import { OHMDAIBondV1 } from '../../generated/DAIBondV1/OHMDAIBondV1'
import { OHMDAIBondV2 } from '../../generated/DAIBondV1/OHMDAIBondV2'
import { OHMDAIBondV3 } from '../../generated/DAIBondV1/OHMDAIBondV3'
import { OHMFRAXBondV1 } from '../../generated/DAIBondV1/OHMFRAXBondV1'
import { OHMFRAXBondV2 } from '../../generated/DAIBondV2/OHMFRAXBondV2'

import { DAIBOND_CONTRACTS1, DAIBOND_CONTRACTS1_BLOCK, DAIBOND_CONTRACTS2, DAIBOND_CONTRACTS2_BLOCK, OHMDAISLPBOND_CONTRACT1, OHMDAISLPBOND_CONTRACT1_BLOCK, OHMDAISLPBOND_CONTRACT2, OHMDAISLPBOND_CONTRACT2_BLOCK, OHMDAISLPBOND_CONTRACT3, OHMDAISLPBOND_CONTRACT3_BLOCK, OHMFRAXLPBOND_CONTRACT1, OHMFRAXLPBOND_CONTRACT1_BLOCK, OHMFRAXLPBOND_CONTRACT2, OHMFRAXLPBOND_CONTRACT2_BLOCK, OHM_ERC20_CONTRACT, SOHM_ERC20_CONTRACT, SOHM_ERC20_CONTRACTV2_BLOCK } from '../utils/Constants'
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

    balance.ohmBalance = toDecimal(ohm_contract.balanceOf(Address.fromString(ohmie.id)), 9)
    balance.sohmBalance = toDecimal(sohm_contract.balanceOf(Address.fromString(ohmie.id)), 9)

    if(transaction.blockNumber.gt(BigInt.fromString(SOHM_ERC20_CONTRACTV2_BLOCK))){
        let sohm_contract_v2 = sOlympusERC20V2.bind(Address.fromString(SOHM_ERC20_CONTRACT))
        balance.sohmBalance = balance.sohmBalance.plus(toDecimal(sohm_contract_v2.balanceOf(Address.fromString(ohmie.id)), 9))
    }


    if(transaction.blockNumber.gt(BigInt.fromString(OHMDAISLPBOND_CONTRACT1_BLOCK))){
        let bondOHMDai_contract = OHMDAIBondV1.bind(Address.fromString(OHMDAISLPBOND_CONTRACT1))
        let pending = bondOHMDai_contract.getDepositorInfo(Address.fromString(ohmie.id))
        if (pending.value1.gt(BigInt.fromString("0"))){
            balance.bondBalance = balance.bondBalance.plus(toDecimal(pending.value1, 9))
        }
    }
    if(transaction.blockNumber.gt(BigInt.fromString(OHMDAISLPBOND_CONTRACT2_BLOCK))){
        let bondOHMDai_contract = OHMDAIBondV2.bind(Address.fromString(OHMDAISLPBOND_CONTRACT2))
        let pending = bondOHMDai_contract.bondInfo(Address.fromString(ohmie.id))
        if (pending.value0.gt(BigInt.fromString("0"))){
            balance.bondBalance = balance.bondBalance.plus(toDecimal(pending.value0, 9))
        }
    }
    if(transaction.blockNumber.gt(BigInt.fromString(OHMDAISLPBOND_CONTRACT3_BLOCK))){
        let bondOHMDai_contract = OHMDAIBondV3.bind(Address.fromString(OHMDAISLPBOND_CONTRACT3))
        let pending = bondOHMDai_contract.bondInfo(Address.fromString(ohmie.id))
        if (pending.value0.gt(BigInt.fromString("0"))){
            balance.bondBalance = balance.bondBalance.plus(toDecimal(pending.value0, 9))
        }
    }
    if(transaction.blockNumber.gt(BigInt.fromString(DAIBOND_CONTRACTS1_BLOCK))){
        let bondDai_contract = DAIBondV1.bind(Address.fromString(DAIBOND_CONTRACTS1))
        let pending = bondDai_contract.getDepositorInfo(Address.fromString(ohmie.id))
        if (pending.value1.gt(BigInt.fromString("0"))){
            balance.bondBalance = balance.bondBalance.plus(toDecimal(pending.value1, 9))
        }
    }
    if(transaction.blockNumber.gt(BigInt.fromString(DAIBOND_CONTRACTS2_BLOCK))){
        let bondDai_contract = DAIBondV2.bind(Address.fromString(DAIBOND_CONTRACTS2))
        let pending = bondDai_contract.bondInfo(Address.fromString(ohmie.id))
        if (pending.value0.gt(BigInt.fromString("0"))){
            balance.bondBalance = balance.bondBalance.plus(toDecimal(pending.value0, 9))
        }
    }
    if(transaction.blockNumber.gt(BigInt.fromString(OHMFRAXLPBOND_CONTRACT1_BLOCK))){
        let bondFRAXDai_contract = OHMFRAXBondV1.bind(Address.fromString(OHMFRAXLPBOND_CONTRACT1))
        let pending = bondFRAXDai_contract.bondInfo(Address.fromString(ohmie.id))
        if (pending.value0.gt(BigInt.fromString("0"))){
            balance.bondBalance = balance.bondBalance.plus(toDecimal(pending.value0, 9))
        }
    }
    if(transaction.blockNumber.gt(BigInt.fromString(OHMFRAXLPBOND_CONTRACT2_BLOCK))){
        let bondFRAXDai_contract = OHMFRAXBondV2.bind(Address.fromString(OHMFRAXLPBOND_CONTRACT2))
        let pending = bondFRAXDai_contract.bondInfo(Address.fromString(ohmie.id))
        if (pending.value0.gt(BigInt.fromString("0"))){
            balance.bondBalance = balance.bondBalance.plus(toDecimal(pending.value0, 9))
        }
    }

    let usdRate = getOHMUSDRate()
    balance.dollarBalance = balance.ohmBalance.times(usdRate).plus(balance.sohmBalance.times(usdRate)).plus(balance.bondBalance.times(usdRate))
    balance.save()

    ohmie.lastBalance = balance.id;
    ohmie.save()
}