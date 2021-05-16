import { Token } from '../../generated/schema'
import { getTokenAdress } from './Constants'

export function loadOrCreateToken(name: string): Token{
    let address = getTokenAdress(name)
    let token = Token.load(address.toHex())
    if (token == null) {
        token = new Token(address.toHex())
        token.name = name
        token.address = address
        token.save()
    }
    return token as Token
}

