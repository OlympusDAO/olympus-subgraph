import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'
import { Ohmie, Transaction } from '../../generated/schema'
import { OlympusERC20 } from '../../generated/DAIBondV1/OlympusERC20'
import { sOlympusERC20 } from '../../generated/DAIBondV1/sOlympusERC20'
import { sOlympusERC20V2 } from '../../generated/DAIBondV1/sOlympusERC20V2'
import { DAIBondV1 } from '../../generated/DAIBondV1/DAIBondV1'
import { DAIBondV2 } from '../../generated/DAIBondV1/DAIBondV2'
import { DAIBondV3 } from '../../generated/DAIBondV1/DAIBondV3'
import { OHMDAIBondV1 } from '../../generated/DAIBondV1/OHMDAIBondV1'
import { OHMDAIBondV2 } from '../../generated/DAIBondV1/OHMDAIBondV2'
import { OHMDAIBondV3 } from '../../generated/DAIBondV1/OHMDAIBondV3'
import { OHMDAIBondV4 } from '../../generated/DAIBondV1/OHMDAIBondV4'
import { OHMFRAXBondV1 } from '../../generated/DAIBondV1/OHMFRAXBondV1'
import { OHMFRAXBondV2 } from '../../generated/DAIBondV1/OHMFRAXBondV2'
import { FRAXBondV1 } from '../../generated/DAIBondV1/FRAXBondV1'

import { DAIBOND_CONTRACTS1, DAIBOND_CONTRACTS1_BLOCK, DAIBOND_CONTRACTS2, DAIBOND_CONTRACTS2_BLOCK, DAIBOND_CONTRACTS3, DAIBOND_CONTRACTS3_BLOCK, FRAXBOND_CONTRACT1, FRAXBOND_CONTRACT1_BLOCK, OHMDAISLPBOND_CONTRACT1, OHMDAISLPBOND_CONTRACT1_BLOCK, OHMDAISLPBOND_CONTRACT2, OHMDAISLPBOND_CONTRACT2_BLOCK, OHMDAISLPBOND_CONTRACT3, OHMDAISLPBOND_CONTRACT3_BLOCK, OHMDAISLPBOND_CONTRACT4, OHMDAISLPBOND_CONTRACT4_BLOCK, OHMFRAXLPBOND_CONTRACT1, OHMFRAXLPBOND_CONTRACT1_BLOCK, OHMFRAXLPBOND_CONTRACT2, OHMFRAXLPBOND_CONTRACT2_BLOCK, OHM_ERC20_CONTRACT, SOHM_ERC20_CONTRACT, SOHM_ERC20_CONTRACTV2_BLOCK } from '../utils/Constants'
import { loadOrCreateOhmieBalance } from './OhmieBalances'
import { toDecimal } from './Decimals'
import { getOHMUSDRate } from './Price'
import { getHolderAux } from './Aux'

export function loadOrCreateOHMie(addres: Address): Ohmie{
    let ohmie = Ohmie.load(addres.toHex())
    if (ohmie == null) {
        let holders = getHolderAux()
        holders.value = holders.value.plus(BigInt.fromI32(1))
        holders.save()

        ohmie = new Ohmie(addres.toHex())
        ohmie.active = true
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

    if(ohmie.active && balance.ohmBalance.lt(BigDecimal.fromString("0.01")) && balance.sohmBalance.lt(BigDecimal.fromString("0.01"))){
        let holders = getHolderAux()
        holders.value = holders.value.minus(BigInt.fromI32(1))
        holders.save()
        ohmie.active = false
    }
    else if(ohmie.active==false && (balance.ohmBalance.lt(BigDecimal.fromString("0.01")) || balance.sohmBalance.lt(BigDecimal.fromString("0.01")))){
        let holders = getHolderAux()
        holders.value = holders.value.plus(BigInt.fromI32(1))
        holders.save()
        ohmie.active = true
    }

    //OHM-DAI
    if(transaction.blockNumber.gt(BigInt.fromString(OHMDAISLPBOND_CONTRACT1_BLOCK))){
        let bondOHMDai_contract = OHMDAIBondV1.bind(Address.fromString(OHMDAISLPBOND_CONTRACT1))
        let pending = bondOHMDai_contract.getDepositorInfo(Address.fromString(ohmie.id))
        if (pending.value1.gt(BigInt.fromString("0"))){
            balance.bondBalance = balance.bondBalance.plus(toDecimal(pending.value1, 9))
            log.debug("Ohmie {} pending OHMDAIBondV1 V1 {} on tx {}", [ohmie.id, toDecimal(pending.value1, 9).toString(), transaction.id])
        }
    }
    if(transaction.blockNumber.gt(BigInt.fromString(OHMDAISLPBOND_CONTRACT2_BLOCK))){
        let bondOHMDai_contract = OHMDAIBondV2.bind(Address.fromString(OHMDAISLPBOND_CONTRACT2))
        let pending = bondOHMDai_contract.bondInfo(Address.fromString(ohmie.id))
        if (pending.value1.gt(BigInt.fromString("0"))){
            balance.bondBalance = balance.bondBalance.plus(toDecimal(pending.value1, 9))
            log.debug("Ohmie {} pending OHMDAIBondV2 V1 {} on tx {}", [ohmie.id, toDecimal(pending.value1, 9).toString(), transaction.id])
        }
    }
    if(transaction.blockNumber.gt(BigInt.fromString(OHMDAISLPBOND_CONTRACT3_BLOCK))){
        let bondOHMDai_contract = OHMDAIBondV3.bind(Address.fromString(OHMDAISLPBOND_CONTRACT3))
        let pending = bondOHMDai_contract.bondInfo(Address.fromString(ohmie.id))
        if (pending.value1.gt(BigInt.fromString("0"))){
            balance.bondBalance = balance.bondBalance.plus(toDecimal(pending.value1, 9))
            log.debug("Ohmie {} pending OHMDAIBondV3 V1 {} on tx {}", [ohmie.id, toDecimal(pending.value1, 9).toString(), transaction.id])
        }
    }
    if(transaction.blockNumber.gt(BigInt.fromString(OHMDAISLPBOND_CONTRACT4_BLOCK))){
        let bondOHMDai_contract = OHMDAIBondV4.bind(Address.fromString(OHMDAISLPBOND_CONTRACT4))
        let pending = bondOHMDai_contract.bondInfo(Address.fromString(ohmie.id))
        if (pending.value1.gt(BigInt.fromString("0"))){
            balance.bondBalance = balance.bondBalance.plus(toDecimal(pending.value1, 9))
            log.debug("Ohmie {} pending OHMDAIBondV4 V1 {} on tx {}", [ohmie.id, toDecimal(pending.value1, 9).toString(), transaction.id])
        }
    }
    //DAI
    if(transaction.blockNumber.gt(BigInt.fromString(DAIBOND_CONTRACTS1_BLOCK))){
        let bondDai_contract = DAIBondV1.bind(Address.fromString(DAIBOND_CONTRACTS1))
        let pending = bondDai_contract.getDepositorInfo(Address.fromString(ohmie.id))
        if (pending.value1.gt(BigInt.fromString("0"))){
            balance.bondBalance = balance.bondBalance.plus(toDecimal(pending.value1, 9))
            log.debug("Ohmie {} pending DAIBondV1 V1 {} on tx {}", [ohmie.id, toDecimal(pending.value1, 9).toString(), transaction.id])
        }
    }
    if(transaction.blockNumber.gt(BigInt.fromString(DAIBOND_CONTRACTS2_BLOCK))){
        let bondDai_contract = DAIBondV2.bind(Address.fromString(DAIBOND_CONTRACTS2))
        let pending = bondDai_contract.bondInfo(Address.fromString(ohmie.id))
        if (pending.value1.gt(BigInt.fromString("0"))){
            balance.bondBalance = balance.bondBalance.plus(toDecimal(pending.value1, 9))
            log.debug("Ohmie {} pending DAIBondV2 V1 {} on tx {}", [ohmie.id, toDecimal(pending.value1, 9).toString(), transaction.id])
        }
    }
    if(transaction.blockNumber.gt(BigInt.fromString(DAIBOND_CONTRACTS3_BLOCK))){
        let bondDai_contract = DAIBondV3.bind(Address.fromString(DAIBOND_CONTRACTS3))
        let pending = bondDai_contract.bondInfo(Address.fromString(ohmie.id))
        if (pending.value1.gt(BigInt.fromString("0"))){
            balance.bondBalance = balance.bondBalance.plus(toDecimal(pending.value1, 9))
            log.debug("Ohmie {} pending DAIBondV3 V1 {} on tx {}", [ohmie.id, toDecimal(pending.value1, 9).toString(), transaction.id])
        }
    }
    //OHM-FRAX
    if(transaction.blockNumber.gt(BigInt.fromString(OHMFRAXLPBOND_CONTRACT1_BLOCK))){
        let bondFRAXDai_contract = OHMFRAXBondV1.bind(Address.fromString(OHMFRAXLPBOND_CONTRACT1))
        let pending = bondFRAXDai_contract.bondInfo(Address.fromString(ohmie.id))
        if (pending.value1.gt(BigInt.fromString("0"))){
            balance.bondBalance = balance.bondBalance.plus(toDecimal(pending.value1, 9))
            log.debug("Ohmie {} pending OHMFRAXBondV1 V1 {} on tx {}", [ohmie.id, toDecimal(pending.value1, 9).toString(), transaction.id])
        }
    }
    if(transaction.blockNumber.gt(BigInt.fromString(OHMFRAXLPBOND_CONTRACT2_BLOCK))){
        let bondFRAXDai_contract = OHMFRAXBondV2.bind(Address.fromString(OHMFRAXLPBOND_CONTRACT2))
        let pending = bondFRAXDai_contract.bondInfo(Address.fromString(ohmie.id))
        if (pending.value1.gt(BigInt.fromString("0"))){
            balance.bondBalance = balance.bondBalance.plus(toDecimal(pending.value1, 9))
            log.debug("Ohmie {} pending OHMFRAXBondV2 V1 {} on tx {}", [ohmie.id, toDecimal(pending.value1, 9).toString(), transaction.id])
        }
    }
    //FRAX
    if(transaction.blockNumber.gt(BigInt.fromString(FRAXBOND_CONTRACT1_BLOCK))){
        let bondFRAXDai_contract = FRAXBondV1.bind(Address.fromString(FRAXBOND_CONTRACT1))
        let pending = bondFRAXDai_contract.bondInfo(Address.fromString(ohmie.id))
        if (pending.value1.gt(BigInt.fromString("0"))){
            balance.bondBalance = balance.bondBalance.plus(toDecimal(pending.value1, 9))
            log.debug("Ohmie {} pending FRAXBondV1 V1 {} on tx {}", [ohmie.id, toDecimal(pending.value1, 9).toString(), transaction.id])
        }
    }

    let usdRate = getOHMUSDRate()
    balance.dollarBalance = balance.ohmBalance.times(usdRate).plus(balance.sohmBalance.times(usdRate)).plus(balance.bondBalance.times(usdRate))
    balance.save()

    ohmie.lastBalance = balance.id;
    ohmie.save()
}