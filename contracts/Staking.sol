//SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0 <0.9.0;

import "./MyToken.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract Staking {
    MyToken private myToken;
    ERC20 private lpToken;
    uint8 public interest = 20;
    uint256 public freezTime = 20;
    uint256 public interestTime = 10;
    address private owner;

    struct StakeData {
        address staker;
        uint256 time;
        uint256 value;
    }

    mapping(address => StakeData) public stakingDatas;
    mapping(address => bool) public hasStaked;

    constructor(MyToken _myToken, ERC20 _lpToken) {
        owner = msg.sender;
        myToken = _myToken;
        lpToken = _lpToken;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not an Owner");
        _;
    }

    //count time went since staking till the moment
    function timeWent() public view returns (uint256) {
        uint256 timeWnt;
        uint256 nowTime = block.timestamp;
        timeWnt = nowTime - stakingDatas[msg.sender].time;
        return timeWnt;
    }

    // function contractBalance() public view returns (uint256) {
    //     return myToken.balanceOf(address(this));
    // }

    function stake(uint256 _value) public {
        require(_value > 0, "nothing to stake");
        //if restaking and TimeLock went then claim all rewards and restake
        if (hasStaked[msg.sender] && (timeWent() > interestTime * 1 minutes)) {
            claim();
            lpToken.transferFrom(msg.sender, address(this), _value);
            stakingDatas[msg.sender].value += _value;
            stakingDatas[msg.sender].time = block.timestamp;

            //if restaking and TimeLock not out then just restake
        } else if (hasStaked[msg.sender]) {
            lpToken.transferFrom(msg.sender, address(this), _value);
            stakingDatas[msg.sender].value += _value;
            stakingDatas[msg.sender].time = block.timestamp;

            //if it's first staking just stake
        } else {
            lpToken.transferFrom(msg.sender, address(this), _value);
            stakingDatas[msg.sender] = StakeData({
                staker: msg.sender,
                time: block.timestamp,
                value: _value
            });
        }

        hasStaked[msg.sender] = true;
    }

    function claim() public {
        //checking that timelock is out
        require(hasStaked[msg.sender], "you don't stake");
        require(
            timeWent() > interestTime * 1 minutes,
            "You should stake more time"
        );
        //counting rewards for staking
        uint256 rewardAmount = (stakingDatas[msg.sender].value * 20) / 100;
        //transfer rewards to investor
        myToken.transfer(msg.sender, rewardAmount);
    }

    function unstake() public {
        require(hasStaked[msg.sender], "you don't stake");
        require(
            timeWent() > freezTime * 1 minutes,
            "You will able unstake after certain time"
        );
        uint256 tokensAmount = (stakingDatas[msg.sender].value);
        lpToken.transfer(msg.sender, tokensAmount);
    }

    function adminChangeConditions(
        uint8 _interest,
        uint256 _freezTime,
        uint256 _finterestTime
    ) public onlyOwner {
        require(
            _interest > 0 && _interest <= 100,
            "interest must be from 1 to 100"
        );
        interest = _interest;
        freezTime = _freezTime;
        interestTime = _finterestTime;
    }
}

//0xcbbF5F94A1Bef4B9F70EeD253691a260AafcC2F0(MTN TOKEN)
//0xbec9eaea4726565b4d15ec33b23bee08ad919b4e UNI-V2
//0x5D6Af9FaD9f9BabB8Fea6CfeEbFFDE59877a16F0 (Staking)

//Техническое задание на неделю 2
/*
Написать смарт-контракт стейкинга, 
создать пул ликвидности на uniswap в тестовой сети. 
Контракт стейкинга принимает ЛП токены, 
после определенного времени (например 10 минут) 
пользователю начисляются награды в виде ревард 
токенов написанных на первой неделе. Количество 
токенов зависит от суммы застейканных ЛП токенов 
(например 20 процентов). Вывести застейканные ЛП токены 
также можно после определенного времени (например 20 минут).

+ Создать пул ликвидности
+ Реализовать функционал стейкинга в смарт контракте
+ Написать полноценные тесты к контракту
+ Написать скрипт деплоя
+Задеплоить в тестовую сеть
+Написать таски на stake, unstake, claim
Верифицировать контракт

Требования
+ Функция stake(uint256 amount) - списывает с пользователя 
на контракт стейкинга ЛП токены в количестве amount, 
обновляет в контракте баланс пользователя

+ Функция claim() - списывает с контракта стейкинга 
ревард токены доступные в качестве наград

+ Функция unstake() - списывает с контракта стейкинга 
ЛП токены доступные для вывода

Функции админа для изменения параметров стейкинга 
(время заморозки, процент)
*/
