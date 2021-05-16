import { Address } from "@graphprotocol/graph-ts";

//Tokens definition
export const DAIBOND_TOKEN: string = "DAI";
export const OHMDAILPBOND_TOKEN: string = "OHM-DAI";
export function getTokenAdress(name: string): Address{
    let address: Address = null
    if (name == DAIBOND_TOKEN)
        address = Address.fromString("0x6b175474e89094c44da98b954eedeac495271d0f")
    else if (name == OHMDAILPBOND_TOKEN)
        address = Address.fromString("0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac")
    return address as Address
}
export const SUSHI_OHMDAI_PAIR = '0x34d7d7Aaf50AD4944B70B320aCB24C95fa2def7c';
export const TREASURY_ADDRESS = "0x886CE997aa9ee4F8c2282E182aB72A705762399D";