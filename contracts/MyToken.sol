//SPDX-License-Identifier: Unlicense
pragma solidity >=0.7.0 <0.9.0;

contract MyToken {
    string private _name = "My Token";
    string private _symbol = "MTN";
    uint256 private _totalSupply;
    uint8 private _decimals = 18;
    address private owner;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowance;

    constructor() {
        owner = msg.sender;
    }

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function decimals() public view returns (uint8) {
        return _decimals;
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address _owner) public view returns (uint256 balance) {
        return _balances[_owner];
    }

    function transfer(address _to, uint256 _value)
        public
        payable
        returns (bool success)
    {
        require(_balances[msg.sender] > _value, "A lack of balance");
        _balances[msg.sender] -= _value;
        _balances[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool success) {
        require(_allowance[_from][msg.sender] >= _value, "Not Approved");
        _balances[_from] -= _value;
        _balances[_to] += _value;
        _allowance[_from][msg.sender] -= _value;
        emit Transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value)
        public
        returns (bool success)
    {
        _allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender)
        public
        view
        returns (uint256 remaining)
    {
        return _allowance[_owner][_spender];
    }

    function increaseAllowance(address _spender, uint256 _amount) public {
        _allowance[msg.sender][_spender] += _amount;
        emit Approval(msg.sender, _spender, _allowance[msg.sender][_spender]);
    }

    function decreaseAllowance(address _spender, uint256 _amount) public {
        _allowance[msg.sender][_spender] -= _amount;
        emit Approval(msg.sender, _spender, _allowance[msg.sender][_spender]);
    }

    function burn(address account, uint256 _amount) public {
        require(_balances[msg.sender] >= _amount, "lack of balance");
        _totalSupply -= _amount;
        _balances[account] -= _amount;
        emit Transfer(account, address(0), _amount);
    }

    function mint(address _to, uint256 _amount) public {
        require(msg.sender == owner, "only owner can mint new tokens");
        _totalSupply += _amount;
        _balances[_to] += _amount;
        emit Transfer(address(0), _to, _amount);
    }

    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    event Approval(
        address indexed _owner,
        address indexed _spender,
        uint256 _value
    );
}

//0xcbbF5F94A1Bef4B9F70EeD253691a260AafcC2F0
