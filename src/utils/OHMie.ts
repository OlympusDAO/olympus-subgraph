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
import { ETHBondV1 } from '../../generated/DAIBondV1/ETHBondV1'

import { DAIBOND_CONTRACTS1, DAIBOND_CONTRACTS1_BLOCK, DAIBOND_CONTRACTS2, DAIBOND_CONTRACTS2_BLOCK, DAIBOND_CONTRACTS3, DAIBOND_CONTRACTS3_BLOCK, ETHBOND_CONTRACT1, ETHBOND_CONTRACT1_BLOCK, FRAXBOND_CONTRACT1, FRAXBOND_CONTRACT1_BLOCK, OHMDAISLPBOND_CONTRACT1, OHMDAISLPBOND_CONTRACT1_BLOCK, OHMDAISLPBOND_CONTRACT2, OHMDAISLPBOND_CONTRACT2_BLOCK, OHMDAISLPBOND_CONTRACT3, OHMDAISLPBOND_CONTRACT3_BLOCK, OHMDAISLPBOND_CONTRACT4, OHMDAISLPBOND_CONTRACT4_BLOCK, OHMFRAXLPBOND_CONTRACT1, OHMFRAXLPBOND_CONTRACT1_BLOCK, OHMFRAXLPBOND_CONTRACT2, OHMFRAXLPBOND_CONTRACT2_BLOCK, OHM_ERC20_CONTRACT, SOHM_ERC20_CONTRACT, SOHM_ERC20_CONTRACTV2, SOHM_ERC20_CONTRACTV2_BLOCK } from '../utils/Constants'
import { loadOrCreateOhmieBalance } from './OhmieBalances'
import { toDecimal } from './Decimals'
import { getOHMUSDRate } from './Price'
import { loadOrCreateContractInfo } from './ContractInfo'
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
    let sohmV1Balance = toDecimal(sohm_contract.balanceOf(Address.fromString(ohmie.id)), 9)
    balance.sohmBalance = sohmV1Balance

    let stakes = balance.stakes

    let cinfoSohmBalance_v1 = loadOrCreateContractInfo(ohmie.id + transaction.timestamp.toString() + "sOlympusERC20")
    cinfoSohmBalance_v1.name = "sOHM"
    cinfoSohmBalance_v1.contract = SOHM_ERC20_CONTRACT
    cinfoSohmBalance_v1.amount = sohmV1Balance
    cinfoSohmBalance_v1.save()
    stakes.push(cinfoSohmBalance_v1.id)

    if(transaction.blockNumber.gt(BigInt.fromString(SOHM_ERC20_CONTRACTV2_BLOCK))){
        let sohm_contract_v2 = sOlympusERC20V2.bind(Address.fromString(SOHM_ERC20_CONTRACTV2))
        let sohmV2Balance = toDecimal(sohm_contract_v2.balanceOf(Address.fromString(ohmie.id)), 9)
        balance.sohmBalance = balance.sohmBalance.plus(sohmV2Balance)

        let cinfoSohmBalance_v2 = loadOrCreateContractInfo(ohmie.id + transaction.timestamp.toString() + "sOlympusERC20V2")
        cinfoSohmBalance_v2.name = "sOHM"
        cinfoSohmBalance_v2.contract = SOHM_ERC20_CONTRACTV2
        cinfoSohmBalance_v2.amount = sohmV2Balance
        cinfoSohmBalance_v2.save()
        stakes.push(cinfoSohmBalance_v2.id)
    }

    balance.stakes = stakes

    if(ohmie.active && balance.ohmBalance.lt(BigDecimal.fromString("0.01")) && balance.sohmBalance.lt(BigDecimal.fromString("0.01"))){
        let holders = getHolderAux()
        holders.value = holders.value.minus(BigInt.fromI32(1))
        holders.save()
        ohmie.active = false
    }
    else if(ohmie.active==false && (balance.ohmBalance.gt(BigDecimal.fromString("0.01")) || balance.sohmBalance.gt(BigDecimal.fromString("0.01")))){
        let holders = getHolderAux()
        holders.value = holders.value.plus(BigInt.fromI32(1))
        holders.save()
        ohmie.active = true
    }

    //OHM-DAI
    let bonds = balance.bonds
    if(transaction.blockNumber.gt(BigInt.fromString(OHMDAISLPBOND_CONTRACT1_BLOCK))){
        let bondOHMDai_contract = OHMDAIBondV1.bind(Address.fromString(OHMDAISLPBOND_CONTRACT1))
        let pending = bondOHMDai_contract.getDepositorInfo(Address.fromString(ohmie.id))
        if (pending.value1.gt(BigInt.fromString("0"))){
            let pending_bond = toDecimal(pending.value1, 9)
            balance.bondBalance = balance.bondBalance.plus(pending_bond)

            let binfo = loadOrCreateContractInfo(ohmie.id + transaction.timestamp.toString() + "OHMDAIBondV1")
            binfo.name = "OHM-DAI"
            binfo.contract = OHMDAISLPBOND_CONTRACT1
            binfo.amount = pending_bond
            binfo.save()
            bonds.push(binfo.id)

            log.debug("Ohmie {} pending OHMDAIBondV1 V1 {} on tx {}", [ohmie.id, toDecimal(pending.value1, 9).toString(), transaction.id])
        }
    }
    if(transaction.blockNumber.gt(BigInt.fromString(OHMDAISLPBOND_CONTRACT2_BLOCK))){
        let bondOHMDai_contract = OHMDAIBondV2.bind(Address.fromString(OHMDAISLPBOND_CONTRACT2))
        let pending = bondOHMDai_contract.bondInfo(Address.fromString(ohmie.id))
        if (pending.value1.gt(BigInt.fromString("0"))){
            let pending_bond = toDecimal(pending.value1, 9)
            balance.bondBalance = balance.bondBalance.plus(pending_bond)

            let binfo = loadOrCreateContractInfo(ohmie.id + transaction.timestamp.toString() + "OHMDAIBondV2")
            binfo.name = "OHM-DAI"
            binfo.contract = OHMDAISLPBOND_CONTRACT2
            binfo.amount = pending_bond
            binfo.save()
            bonds.push(binfo.id)
            
            log.debug("Ohmie {} pending OHMDAIBondV2 V1 {} on tx {}", [ohmie.id, toDecimal(pending.value1, 9).toString(), transaction.id])
        }
    }
    if(transaction.blockNumber.gt(BigInt.fromString(OHMDAISLPBOND_CONTRACT3_BLOCK))){
        let bondOHMDai_contract = OHMDAIBondV3.bind(Address.fromString(OHMDAISLPBOND_CONTRACT3))
        let pending = bondOHMDai_contract.bondInfo(Address.fromString(ohmie.id))
        if (pending.value1.gt(BigInt.fromString("0"))){
            let pending_bond = toDecimal(pending.value1, 9)
            balance.bondBalance = balance.bondBalance.plus(pending_bond)

            let binfo = loadOrCreateContractInfo(ohmie.id + transaction.timestamp.toString() + "OHMDAIBondV3")
            binfo.name = "OHM-DAI"
            binfo.contract = OHMDAISLPBOND_CONTRACT3
            binfo.amount = pending_bond
            binfo.save()
            bonds.push(binfo.id)

            log.debug("Ohmie {} pending OHMDAIBondV3 V1 {} on tx {}", [ohmie.id, toDecimal(pending.value1, 9).toString(), transaction.id])
        }
    }
    if(transaction.blockNumber.gt(BigInt.fromString(OHMDAISLPBOND_CONTRACT4_BLOCK))){
        let bondOHMDai_contract = OHMDAIBondV4.bind(Address.fromString(OHMDAISLPBOND_CONTRACT4))
        let pending = bondOHMDai_contract.bondInfo(Address.fromString(ohmie.id))
        if (pending.value1.gt(BigInt.fromString("0"))){
            let pending_bond = toDecimal(pending.value1, 9)
            balance.bondBalance = balance.bondBalance.plus(pending_bond)

            let binfo = loadOrCreateContractInfo(ohmie.id + transaction.timestamp.toString() + "OHMDAIBondV4")
            binfo.name = "OHM-DAI"
            binfo.contract = OHMDAISLPBOND_CONTRACT4
            binfo.amount = pending_bond
            binfo.save()
            bonds.push(binfo.id)

            log.debug("Ohmie {} pending OHMDAIBondV4 V1 {} on tx {}", [ohmie.id, toDecimal(pending.value1, 9).toString(), transaction.id])
        }
    }
    //DAI
    if(transaction.blockNumber.gt(BigInt.fromString(DAIBOND_CONTRACTS1_BLOCK))){
        let bondDai_contract = DAIBondV1.bind(Address.fromString(DAIBOND_CONTRACTS1))
        let pending = bondDai_contract.getDepositorInfo(Address.fromString(ohmie.id))
        if (pending.value1.gt(BigInt.fromString("0"))){
            let pending_bond = toDecimal(pending.value1, 9)
            balance.bondBalance = balance.bondBalance.plus(pending_bond)

            let binfo = loadOrCreateContractInfo(ohmie.id + transaction.timestamp.toString() + "DAIBondV1")
            binfo.name = "DAI"
            binfo.contract = DAIBOND_CONTRACTS1
            binfo.amount = pending_bond
            binfo.save()
            bonds.push(binfo.id)

            log.debug("Ohmie {} pending DAIBondV1 V1 {} on tx {}", [ohmie.id, toDecimal(pending.value1, 9).toString(), transaction.id])
        }
    }
    if(transaction.blockNumber.gt(BigInt.fromString(DAIBOND_CONTRACTS2_BLOCK))){
        let bondDai_contract = DAIBondV2.bind(Address.fromString(DAIBOND_CONTRACTS2))
        let pending = bondDai_contract.bondInfo(Address.fromString(ohmie.id))
        if (pending.value1.gt(BigInt.fromString("0"))){
            let pending_bond = toDecimal(pending.value1, 9)
            balance.bondBalance = balance.bondBalance.plus(pending_bond)

            let binfo = loadOrCreateContractInfo(ohmie.id + transaction.timestamp.toString() + "DAIBondV2")
            binfo.name = "DAI"
            binfo.contract = DAIBOND_CONTRACTS2
            binfo.amount = pending_bond
            binfo.save()
            bonds.push(binfo.id)

            log.debug("Ohmie {} pending DAIBondV2 V1 {} on tx {}", [ohmie.id, toDecimal(pending.value1, 9).toString(), transaction.id])
        }
    }
    if(transaction.blockNumber.gt(BigInt.fromString(DAIBOND_CONTRACTS3_BLOCK))){
        let bondDai_contract = DAIBondV3.bind(Address.fromString(DAIBOND_CONTRACTS3))
        let pending = bondDai_contract.bondInfo(Address.fromString(ohmie.id))
        if (pending.value1.gt(BigInt.fromString("0"))){
            let pending_bond = toDecimal(pending.value1, 9)
            balance.bondBalance = balance.bondBalance.plus(pending_bond)

            let binfo = loadOrCreateContractInfo(ohmie.id + transaction.timestamp.toString() + "DAIBondV3")
            binfo.name = "DAI"
            binfo.contract = DAIBOND_CONTRACTS3
            binfo.amount = pending_bond
            binfo.save()
            bonds.push(binfo.id)

            log.debug("Ohmie {} pending DAIBondV3 V1 {} on tx {}", [ohmie.id, toDecimal(pending.value1, 9).toString(), transaction.id])
        }
    }
    //OHM-FRAX
    if(transaction.blockNumber.gt(BigInt.fromString(OHMFRAXLPBOND_CONTRACT1_BLOCK))){
        let bondFRAXDai_contract = OHMFRAXBondV1.bind(Address.fromString(OHMFRAXLPBOND_CONTRACT1))
        let pending = bondFRAXDai_contract.bondInfo(Address.fromString(ohmie.id))
        if (pending.value1.gt(BigInt.fromString("0"))){
            let pending_bond = toDecimal(pending.value1, 9)
            balance.bondBalance = balance.bondBalance.plus(pending_bond)

            let binfo = loadOrCreateContractInfo(ohmie.id + transaction.timestamp.toString() + "OHMFRAXBondV1")
            binfo.name = "DAI"
            binfo.contract = OHMFRAXLPBOND_CONTRACT1
            binfo.amount = pending_bond
            binfo.save()
            bonds.push(binfo.id)

            log.debug("Ohmie {} pending OHMFRAXBondV1 V1 {} on tx {}", [ohmie.id, toDecimal(pending.value1, 9).toString(), transaction.id])
        }
    }
    if(transaction.blockNumber.gt(BigInt.fromString(OHMFRAXLPBOND_CONTRACT2_BLOCK))){
        let bondFRAXDai_contract = OHMFRAXBondV2.bind(Address.fromString(OHMFRAXLPBOND_CONTRACT2))
        let pending = bondFRAXDai_contract.bondInfo(Address.fromString(ohmie.id))
        if (pending.value1.gt(BigInt.fromString("0"))){
            let pending_bond = toDecimal(pending.value1, 9)
            balance.bondBalance = balance.bondBalance.plus(pending_bond)

            let binfo = loadOrCreateContractInfo(ohmie.id + transaction.timestamp.toString() + "OHMFRAXBondV2")
            binfo.name = "DAI"
            binfo.contract = OHMFRAXLPBOND_CONTRACT2
            binfo.amount = pending_bond
            binfo.save()
            bonds.push(binfo.id)

            log.debug("Ohmie {} pending OHMFRAXBondV2 V1 {} on tx {}", [ohmie.id, toDecimal(pending.value1, 9).toString(), transaction.id])
        }
    }
    //FRAX
    if(transaction.blockNumber.gt(BigInt.fromString(FRAXBOND_CONTRACT1_BLOCK))){
        let bondFRAX_contract = FRAXBondV1.bind(Address.fromString(FRAXBOND_CONTRACT1))
        let pending = bondFRAX_contract.bondInfo(Address.fromString(ohmie.id))
        if (pending.value1.gt(BigInt.fromString("0"))){
            let pending_bond = toDecimal(pending.value1, 9)
            balance.bondBalance = balance.bondBalance.plus(pending_bond)

            let binfo = loadOrCreateContractInfo(ohmie.id + transaction.timestamp.toString() + "FRAXBondV1")
            binfo.name = "DAI"
            binfo.contract = FRAXBOND_CONTRACT1
            binfo.amount = pending_bond
            binfo.save()
            bonds.push(binfo.id)

            log.debug("Ohmie {} pending FRAXBondV1 V1 {} on tx {}", [ohmie.id, toDecimal(pending.value1, 9).toString(), transaction.id])
        }
    }
    //WETH
    if(transaction.blockNumber.gt(BigInt.fromString(ETHBOND_CONTRACT1_BLOCK))){
        let bondETH_contract = ETHBondV1.bind(Address.fromString(ETHBOND_CONTRACT1))
        let pending = bondETH_contract.bondInfo(Address.fromString(ohmie.id))
        if (pending.value1.gt(BigInt.fromString("0"))){
            let pending_bond = toDecimal(pending.value1, 9)
            balance.bondBalance = balance.bondBalance.plus(pending_bond)

            let binfo = loadOrCreateContractInfo(ohmie.id + transaction.timestamp.toString() + "FRAXBondV1")
            binfo.name = "DAI"
            binfo.contract = FRAXBOND_CONTRACT1
            binfo.amount = pending_bond
            binfo.save()
            bonds.push(binfo.id)

            log.debug("Ohmie {} pending ETHBondV1 V1 {} on tx {}", [ohmie.id, toDecimal(pending.value1, 9).toString(), transaction.id])
        }
    }
    balance.bonds = bonds

    //TODO add LUSD and OHMLUSD

    //Price
    let usdRate = getOHMUSDRate()
    balance.dollarBalance = balance.ohmBalance.times(usdRate).plus(balance.sohmBalance.times(usdRate)).plus(balance.bondBalance.times(usdRate))
    balance.save()

    ohmie.lastBalance = balance.id;
    ohmie.save()
}