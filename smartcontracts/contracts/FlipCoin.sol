//SPDX-License-Identifier: UNLICENSED
pragma solidity <=0.8.10;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/utils/SafeERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract FlipCoin is VRFConsumerBaseV2, Ownable {
    using SafeERC20 for IERC20;
    VRFCoordinatorV2Interface COORDINATOR;
    // Your subscription ID.
    uint64 s_subscriptionId;

    // Goerli coordinator. For other networks,
    // see https://docs.chain.link/docs/vrf-contracts/#configurations
    address vrfCoordinator = 0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D;

    // The gas lane to use, which specifies the maximum gas price to bump to.
    // For a list of available gas lanes on each network,
    // see https://docs.chain.link/docs/vrf-contracts/#configurations
    bytes32 keyHash =
        0xd4bb89654db74673a187bd804519e65e3f71a52bc55f11da7601a13dcf505314;

    // Depends on the number of requested values that you want sent to the
    // fulfillRandomWords() function. Storing each word costs about 20,000 gas,
    // so 100,000 is a safe default for this example contract. Test and adjust
    // this limit based on the network that you select, the size of the request,
    // and the processing of the callback request in the fulfillRandomWords()
    // function.
    uint32 callbackGasLimit = 100000;

    // The default is 3, but you can set this higher.
    uint16 requestConfirmations = 3;

    // For this example, retrieve 2 random values in one request.
    // Cannot exceed VRFCoordinatorV2.MAX_NUM_WORDS.
    uint32 numWords = 1;

    uint256[] public s_randomWords;
    uint256 public s_requestId;

    // random number is 0: head, 1: tail
    uint256 public taxFee = 35; // 3,5 %
    uint256 public taxFeeMin = 20; // 2 %
    uint256 public taxFeeMax = 100; // 10 %
    uint256 public totalRequest=0;
    uint256 public totalWinCount=0;
    uint256 public totalRemainBalance=0;
    
    struct playerInfor {
        uint256 winCount;
        uint256 total;
        uint256 balance;
    }

    struct requestInfor{
        address player;
        uint256 bet;
        uint256 betAmount;
        uint result;
        bool hasResult;
    }
    mapping(uint256 => requestInfor) public requestInfors;
    mapping(address => playerInfor) public playerInfors;
    // uint256[]: list request id
    mapping(address => uint256[]) public players;

    
    event SetCoordinator(address setter, address newCoordinator);
    event SetTaxFee(address setter, uint256 newFee);
    event SetTaxFeeMinMax(address setter, uint256 newFeeMin, uint256 newFeeMax);
    event Flip(
        address player,
        uint256 bet,
        uint256 betAmount,
        uint256 requestId
    );
    event Result(
        address player,
        uint256 requestid,
        uint256 result
    );
    event Claim(
        address player,
        uint256 amount
    );

    constructor(uint64 subscriptionId, address coordinator)
        VRFConsumerBaseV2(coordinator)
    {
        COORDINATOR = VRFCoordinatorV2Interface(coordinator);
        vrfCoordinator = coordinator;
        s_subscriptionId = subscriptionId;
    }

    function setCoordinator(address newCoordinator) public onlyOwner {
        vrfCoordinator = newCoordinator;
        emit SetCoordinator(msg.sender, newCoordinator);
    }

    function setTaxFee(uint256 newFee) public onlyOwner {
        require(newFee>=taxFeeMin&&newFee<=taxFeeMax,"Fee out of range");
        taxFee = newFee;
        emit SetTaxFee(msg.sender, newFee);
    }

    function setTaxFeeMinMax(uint256 newFeeMin, uint256 newFeeMax)
        public
        onlyOwner
    {
        taxFeeMin = newFeeMin;
        taxFeeMax = newFeeMax;
        emit SetTaxFeeMinMax(msg.sender, newFeeMin, newFeeMax);
    }

    function setKeyHash(bytes32 newHash)public onlyOwner{
        keyHash=newHash;
    }

    function flip(uint256 bet) public payable {
        uint256 amount=msg.value;
        require(
            msg.sender.balance >= amount,
            "Insufficient account balance"
        );
        // value/(1000 + taxfee)*1000 =amount bet
        uint256 betAmount=msg.value/(1000 +taxFee)*1000;
        uint256 fee = betAmount * (taxFee / 1000);
        uint256 neededBalance = (betAmount * 2 + fee + totalRemainBalance); // balance need to pay for player
        require(address(this).balance >=neededBalance, "FlipCoin: Insufficient account balance");
        uint256 requestid =requestRandomWords();
        //uint256 requestid =1;
        players[msg.sender].push(requestid);
        requestInfors[requestid].player=msg.sender;
        requestInfors[requestid].bet=bet;
        requestInfors[requestid].betAmount=betAmount;

        totalRequest+=1;
        playerInfors[msg.sender].total+=1;

        emit Flip(msg.sender, bet, betAmount, requestid);
    }

  function requestRandomWords() internal returns(uint256) {
    // Will revert if subscription is not set and funded.
     return COORDINATOR.requestRandomWords(
      keyHash,
      s_subscriptionId,
      requestConfirmations,
      callbackGasLimit,
      numWords
    );
  }

    function fulfillRandomWords(
        uint256 requestId, /* requestId */
        uint256[] memory randomWords
    ) internal override {
        uint result=randomWords[0]%2;
        requestInfors[requestId].result=result;
        requestInfors[requestId].hasResult=true;
        uint bet=requestInfors[requestId].bet;
        uint256 betAmount=requestInfors[requestId].betAmount;
        address player=requestInfors[requestId].player;
        //
        if(bet==result)//win
        {
            playerInfors[player].winCount+=1;
            playerInfors[player].balance+=betAmount*2;
            totalWinCount+1;
            totalRemainBalance+=betAmount*2;
        }
        emit Result(player, requestId, result);
    }

    function claim() public{
        playerInfor storage playerinfor= playerInfors[msg.sender];
        uint256 amount=playerinfor.balance;
        require(playerinfor.balance>0,"Insufficient account balance");
        require(address(this).balance>=amount,"FlipCoin: Insufficient account balance");
        playerinfor.balance=0;
        totalRemainBalance-=amount;
        payable(msg.sender).transfer(amount);
        emit Claim(msg.sender, amount);
    }

    function withdraw(uint256 amount) public onlyOwner {
        uint256 availableBalance=address(this).balance-totalRemainBalance;
        require(availableBalance>=amount,"FlipCoin: Insufficient account balance");
        payable(msg.sender).transfer(amount);
    }
    receive() external payable{
            
    }

}
