Контракт Staking

Функции:
stake(uint256 amount) - списывает с пользователя на контракт стейкинга ЛП токены в количестве amount, обновляет в контракте баланс пользователя

claim() - списывает с контракта стейкинга ревард токены доступные в качестве наград

unstake() - списывает с контракта стейкинга ЛП токены доступные для вывода

adminChangeConditions() - функция админа для изменения параметров стейкинга (время заморозки, процент)


Сформированные tasks:

- npx hardhat stake
- npx hardhat unstake
- npx hardhat claim

Контракт - https://rinkeby.etherscan.io/address/0x5D6Af9FaD9f9BabB8Fea6CfeEbFFDE59877a16F0 (Staking)


//0xcbbF5F94A1Bef4B9F70EeD253691a260AafcC2F0(MTN TOKEN)
//0xbec9eaea4726565b4d15ec33b23bee08ad919b4e (lpTokens - UNI-V2)
//0x5D6Af9FaD9f9BabB8Fea6CfeEbFFDE59877a16F0 (Staking)

