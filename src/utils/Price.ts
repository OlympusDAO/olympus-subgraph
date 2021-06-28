import {
    SUSHI_OHMDAI_PAIR,
} from './Constants'
import { Address, BigDecimal } from '@graphprotocol/graph-ts'
import { UniswapV2Pair } from '../../generated/DAIBondV1/UniswapV2Pair'


let BIG_DECIMAL_1E9 = BigDecimal.fromString('1e9')


export function getOHMUSDRate(): BigDecimal {
    let pair = UniswapV2Pair.bind(Address.fromString(SUSHI_OHMDAI_PAIR))

    let reserves = pair.getReserves()
    let reserve0 = reserves.value0.toBigDecimal()
    let reserve1 = reserves.value1.toBigDecimal()
    return reserve1.div(reserve0).div(BIG_DECIMAL_1E9)
}