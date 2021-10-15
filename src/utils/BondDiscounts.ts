import { Address, BigDecimal, BigInt, log} from '@graphprotocol/graph-ts'
import { OHMDAIBondV1 } from '../../generated/OHMDAIBondV1/OHMDAIBondV1';
import { OHMDAIBondV2 } from '../../generated/OHMDAIBondV1/OHMDAIBondV2';
import { OHMDAIBondV3 } from '../../generated/OHMDAIBondV1/OHMDAIBondV3';
import { OHMDAIBondV4 } from '../../generated/OHMDAIBondV1/OHMDAIBondV4';
import { DAIBondV1 } from '../../generated/DAIBondV1/DAIBondV1';
import { DAIBondV2 } from '../../generated/DAIBondV1/DAIBondV2';
import { DAIBondV3 } from '../../generated/DAIBondV1/DAIBondV3';
import { OHMFRAXBondV1 } from '../../generated/OHMFRAXBondV1/OHMFRAXBondV1';
import { OHMFRAXBondV2 } from '../../generated/OHMFRAXBondV2/OHMFRAXBondV2';
import { FRAXBondV1 } from '../../generated/FRAXBondV1/FRAXBondV1';
import { ETHBondV1 } from '../../generated/ETHBondV1/ETHBondV1';
import { LUSDBondV1 } from '../../generated/LUSDBondV1/LUSDBondV1';
import { OHMLUSDBondV1 } from '../../generated/OHMLUSDBondV1/OHMLUSDBondV1';

import { BondDiscount, Transaction } from '../../generated/schema'
import { DAIBOND_CONTRACTS1, DAIBOND_CONTRACTS1_BLOCK, DAIBOND_CONTRACTS2, DAIBOND_CONTRACTS2_BLOCK, DAIBOND_CONTRACTS3, DAIBOND_CONTRACTS3_BLOCK, ETHBOND_CONTRACT1, ETHBOND_CONTRACT1_BLOCK, FRAXBOND_CONTRACT1, FRAXBOND_CONTRACT1_BLOCK, LUSDBOND_CONTRACT1, LUSDBOND_CONTRACT1_BLOCK, OHMDAISLPBOND_CONTRACT1, OHMDAISLPBOND_CONTRACT1_BLOCK, OHMDAISLPBOND_CONTRACT2, OHMDAISLPBOND_CONTRACT2_BLOCK, OHMDAISLPBOND_CONTRACT3, OHMDAISLPBOND_CONTRACT3_BLOCK, OHMDAISLPBOND_CONTRACT4, OHMDAISLPBOND_CONTRACT4_BLOCK, OHMFRAXLPBOND_CONTRACT1, OHMFRAXLPBOND_CONTRACT1_BLOCK, OHMFRAXLPBOND_CONTRACT2, OHMFRAXLPBOND_CONTRACT2_BLOCK, OHMLUSDBOND_CONTRACT1, OHMLUSDBOND_CONTRACT1_BLOCK } from './Constants';
import { hourFromTimestamp } from './Dates';
import { toDecimal } from './Decimals';
import { getOHMUSDRate } from './Price';

export function loadOrCreateBondDiscount(timestamp: BigInt): BondDiscount{
    let hourTimestamp = hourFromTimestamp(timestamp);

    let bondDiscount = BondDiscount.load(hourTimestamp)
    if (bondDiscount == null) {
        bondDiscount = new BondDiscount(hourTimestamp)
        bondDiscount.timestamp = timestamp
        bondDiscount.dai_discount  = BigDecimal.fromString("0")
        bondDiscount.ohmdai_discount = BigDecimal.fromString("0")
        bondDiscount.frax_discount = BigDecimal.fromString("0")
        bondDiscount.ohmfrax_discount = BigDecimal.fromString("0")
        bondDiscount.eth_discount = BigDecimal.fromString("0")
        bondDiscount.lusd_discount = BigDecimal.fromString("0")
        bondDiscount.ohmlusd_discount = BigDecimal.fromString("0")
        bondDiscount.save()
    }
    return bondDiscount as BondDiscount
}

export function updateBondDiscounts(transaction: Transaction): void{
    let bd = loadOrCreateBondDiscount(transaction.timestamp);
    let ohmRate = getOHMUSDRate();

    //OHMDAI
    if(transaction.blockNumber.gt(BigInt.fromString(OHMDAISLPBOND_CONTRACT1_BLOCK))){
        let bond = OHMDAIBondV1.bind(Address.fromString(OHMDAISLPBOND_CONTRACT1))
        //bd.ohmdai_discount = ohmRate.div(toDecimal(bond.bondPriceInUSD(), 18)).minus(BigDecimal.fromString("1")).times(BigDecimal.fromString("100"))
    }
    if(transaction.blockNumber.gt(BigInt.fromString(OHMDAISLPBOND_CONTRACT2_BLOCK))){
        let bond = OHMDAIBondV2.bind(Address.fromString(OHMDAISLPBOND_CONTRACT2))
        //bd.ohmdai_discount = ohmRate.div(toDecimal(bond.bondPriceInUSD(), 18)).minus(BigDecimal.fromString("1")).times(BigDecimal.fromString("100"))
    }
    if(transaction.blockNumber.gt(BigInt.fromString(OHMDAISLPBOND_CONTRACT3_BLOCK))){
        let bond = OHMDAIBondV3.bind(Address.fromString(OHMDAISLPBOND_CONTRACT3))
        //bd.ohmdai_discount = ohmRate.div(toDecimal(bond.bondPriceInUSD(), 18)).minus(BigDecimal.fromString("1")).times(BigDecimal.fromString("100"))
    }
    if(transaction.blockNumber.gt(BigInt.fromString(OHMDAISLPBOND_CONTRACT4_BLOCK))){
        let bond = OHMDAIBondV4.bind(Address.fromString(OHMDAISLPBOND_CONTRACT4))
        bd.ohmdai_discount = ohmRate.div(toDecimal(bond.bondPriceInUSD(), 18)).minus(BigDecimal.fromString("1")).times(BigDecimal.fromString("100"))
    }

    //DAI
    if(transaction.blockNumber.gt(BigInt.fromString(DAIBOND_CONTRACTS1_BLOCK))){
        let bond = DAIBondV1.bind(Address.fromString(DAIBOND_CONTRACTS1))
        //bd.dai_discount = ohmRate.div(toDecimal(bond.bondPriceInUSD(), 18)).minus(BigDecimal.fromString("1")).times(BigDecimal.fromString("100"))
    }
    if(transaction.blockNumber.gt(BigInt.fromString(DAIBOND_CONTRACTS2_BLOCK))){
        let bond = DAIBondV2.bind(Address.fromString(DAIBOND_CONTRACTS2))
        bd.dai_discount = ohmRate.div(toDecimal(bond.bondPriceInUSD(), 18)).minus(BigDecimal.fromString("1")).times(BigDecimal.fromString("100"))
    }
    if(transaction.blockNumber.gt(BigInt.fromString(DAIBOND_CONTRACTS3_BLOCK))){
        let bond = DAIBondV3.bind(Address.fromString(DAIBOND_CONTRACTS3))
        bd.dai_discount = ohmRate.div(toDecimal(bond.bondPriceInUSD(), 18)).minus(BigDecimal.fromString("1")).times(BigDecimal.fromString("100"))
    }

    //OHMFRAX
    if(transaction.blockNumber.gt(BigInt.fromString(OHMFRAXLPBOND_CONTRACT1_BLOCK))){
        let bond = OHMFRAXBondV1.bind(Address.fromString(OHMFRAXLPBOND_CONTRACT1))
        bd.ohmfrax_discount = ohmRate.div(toDecimal(bond.bondPriceInUSD(), 18)).minus(BigDecimal.fromString("1")).times(BigDecimal.fromString("100"))
    }
    if(transaction.blockNumber.gt(BigInt.fromString(OHMFRAXLPBOND_CONTRACT2_BLOCK))){
        let bond = OHMFRAXBondV2.bind(Address.fromString(OHMFRAXLPBOND_CONTRACT2))
        bd.ohmfrax_discount = ohmRate.div(toDecimal(bond.bondPriceInUSD(), 18)).minus(BigDecimal.fromString("1")).times(BigDecimal.fromString("100"))
    }

    //FRAX
    if(transaction.blockNumber.gt(BigInt.fromString(FRAXBOND_CONTRACT1_BLOCK))){
        let bond = FRAXBondV1.bind(Address.fromString(FRAXBOND_CONTRACT1))
        bd.frax_discount = ohmRate.div(toDecimal(bond.bondPriceInUSD(), 18)).minus(BigDecimal.fromString("1")).times(BigDecimal.fromString("100"))
    }

    //ETH
    if(transaction.blockNumber.gt(BigInt.fromString(ETHBOND_CONTRACT1_BLOCK))){
        let bond = ETHBondV1.bind(Address.fromString(ETHBOND_CONTRACT1))
        bd.eth_discount = ohmRate.div(toDecimal(bond.bondPriceInUSD(), 18)).minus(BigDecimal.fromString("1")).times(BigDecimal.fromString("100"))
    }

    //LUSD
    if(transaction.blockNumber.gt(BigInt.fromString(LUSDBOND_CONTRACT1_BLOCK))){
        let bond = LUSDBondV1.bind(Address.fromString(LUSDBOND_CONTRACT1))
        bd.lusd_discount = ohmRate.div(toDecimal(bond.bondPriceInUSD(), 18)).minus(BigDecimal.fromString("1")).times(BigDecimal.fromString("100"))
    }

    //OHMLUSD
    if(transaction.blockNumber.gt(BigInt.fromString(OHMLUSDBOND_CONTRACT1_BLOCK))){
        let bond = OHMLUSDBondV1.bind(Address.fromString(OHMLUSDBOND_CONTRACT1))
        bd.ohmlusd_discount = ohmRate.div(toDecimal(bond.bondPriceInUSD(), 18)).minus(BigDecimal.fromString("1")).times(BigDecimal.fromString("100"))
    }
    
    bd.save()
}