import {
  HStack,
  Text,
  Image,
  Avatar,
  Flex,
  VStack,
  Stack,
} from "@chakra-ui/react";
import Link from "next/link";
import React, { memo, useEffect } from "react";
import { getLeaderBoardApi } from "../../apis";
import { fonts } from "../../configs/constants";
import { useAppSelector } from "../../reduxs/hooks";
import { Player } from "../../types";
import { fromNow, getBscScanUrl, numberFormat, showSortAddress } from "../../utils";

const FlippedList =() => {
  const [players, setPlayers] = React.useState<Player[]>([]);

  const url = getBscScanUrl() || '#';

  const handleLoad = React.useCallback(async() => {
    const rs = await getLeaderBoardApi();
    setPlayers(rs)
  }, []);

  useEffect(() => {
    handleLoad();
    const interval = setInterval(() => {
      handleLoad();
    }, 1000 * 10);
    return () => clearInterval(interval)    ;
  }, []);

  return (
    <Flex
      as="ul"
      w={{ base: "100%", lg: "35%" }}
      bg="rgba(255,255,255, 0.11)"
      direction="column"
      borderRadius="6px"
      border="1px solid rgba(255,255,255, 0.2)"
      mt="50px"
    >
      {players.map((item, index) => (
        <HStack
          as="li"
          key={index}
          py="10px"
          justifyContent="space-between"
          borderBottom="1px solid rgba(255,255,255, 0.2)"
          px="10px"
        >
          <Stack direction={{ base: "column", lg: "row" }}>
            <HStack>
              <Image src="/bnb.png" w="20px" />
              <Text
                variant="with-title"
                fontSize="10px"
                color="rgba(255,255,255, 0.8)"
              >
                {showSortAddress(item.player)}
              </Text>
            </HStack>
            <Text
              variant="with-title"
              fontSize="10px"
              color="rgba(255,255,255, 0.6)"
            >
              flipped {numberFormat(item.betAmount)} {item.isWin ? 'and double' : 'and got rugged'}.
            </Text>
          </Stack>
          <VStack alignItems="flex-end">
            <Text
              variant="with-title"
              fontFamily={fonts.DMSANS_ITALIC}
              fontSize="12px"
              color="gray"
              fontStyle="italic"
              mb="-10px"
            >
              {fromNow(item.playAt * 1000)}
            </Text>
            <Link href={`${url}${item.transaction_id}`}>
              <a target="_blank">
                <Text
                  textDecoration="underline"
                  variant="with-title"
                  fontFamily={fonts.DMSANS_ITALIC}
                  fontSize="10px"
                  color="gray"
                  fontStyle="italic"
                  mb="-10px"
                  mt="-5px"
                >
                  View on block explorer
                </Text>
              </a>
            </Link>
          </VStack>
        </HStack>
      ))}
    </Flex>
  );
}

export default memo(FlippedList);
