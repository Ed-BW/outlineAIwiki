
import { observer } from "mobx-react";
import * as React from "react";
import styled from "styled-components";
import { s } from "@shared/styles";
import Document from "~/models/Document";
import Flex from "~/components/Flex";
import Icon from "~/components/Icon";

type Props = {
  document: Document;
};

function Hero({ document }: Props) {
  return (
    <Wrapper align="center" gap={16}>
      {document.icon && (
        <IconWrapper>
          <Icon value={document.icon} color={document.color ?? undefined} size={48} />
        </IconWrapper>
      )}
      <Title>{document.titleWithDefault}</Title>
    </Wrapper>
  );
}

const Wrapper = styled(Flex)`
  margin-bottom: 2em;
  padding-bottom: 1em;
  border-bottom: 1px solid ${s("divider")};
`;

const IconWrapper = styled.div`
  padding: 8px;
  border-radius: 8px;
  background-color: ${s("secondaryBackground")};
`;

const Title = styled.h1`
  font-size: 2.5em;
  font-weight: 600;
  margin: 0;
`;

export default observer(Hero);
