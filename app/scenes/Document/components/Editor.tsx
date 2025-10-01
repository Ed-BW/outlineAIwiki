import { observer } from "mobx-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { mergeRefs } from "react-merge-refs";
import { useRouteMatch } from "react-router-dom";
import styled from "styled-components";
import Text from "@shared/components/Text";
import { richExtensions, withComments } from "@shared/editor/nodes";
import { TeamPreference } from "@shared/types";
import { colorPalette } from "@shared/utils/collections";
import Comment from "~/models/Comment";
import Document from "~/models/Document";
import { RefHandle } from "~/components/ContentEditable";
import { useDocumentContext } from "~/components/DocumentContext";
import Editor, { Props as EditorProps } from "~/components/Editor";
import Flex from "~/components/Flex";
import Time from "~/components/Time";
import { withUIExtensions } from "~/editor/extensions";
import useCurrentTeam from "~/hooks/useCurrentTeam";
import useCurrentUser from "~/hooks/useCurrentUser";
import { useFocusedComment } from "~/hooks/useFocusedComment";
import { useLocationSidebarContext } from "~/hooks/useLocationSidebarContext";
import usePolicy from "~/hooks/usePolicy";
import useQuery from "~/hooks/useQuery";
import useStores from "~/hooks/useStores";
import {
  documentHistoryPath,
  documentPath,
  matchDocumentHistory,
} from "~/utils/routeHelpers";
import { decodeURIComponentSafe } from "~/utils/urls";
import MultiplayerEditor from "./AsyncMultiplayerEditor";
import DocumentMeta from "./DocumentMeta";
import DocumentTitle from "./DocumentTitle";
import first from "lodash/first";

const extensions = withUIExtensions(withComments(richExtensions));

type Props = Omit<EditorProps, "editorStyle"> & {
  onChangeTitle: (title: string) => void;
  onChangeIcon: (icon: string | null, color: string | null) => void;
  id: string;
  document: Document;
  isDraft: boolean;
  multiplayer?: boolean;
  onSave: (options: {
    done?: boolean;
    autosave?: boolean;
    publish?: boolean;
  }) => void;
  children: React.ReactNode;
};

/**
 * The main document editor includes an editable title with metadata below it,
 * and support for commenting.
 */
function DocumentEditor(props: Props, ref: React.RefObject<any>) {
  const titleRef = React.useRef<RefHandle>(null);
  const { t } = useTranslation();
  const match = useRouteMatch();
  const { setFocusedCommentId } = useDocumentContext();
  const focusedComment = useFocusedComment();
  const { ui, comments } = useStores();
  const user = useCurrentUser({ rejectOnEmpty: false });
  const team = useCurrentTeam({ rejectOnEmpty: false });
  const sidebarContext = useLocationSidebarContext();
  const params = useQuery();
  const {
    document,
    onChangeTitle,
    onChangeIcon,
    isDraft,
    shareId,
    readOnly,
    children,
    multiplayer,
    ...rest
  } = props;
  const can = usePolicy(document);
  const commentingEnabled = !!team?.getPreference(TeamPreference.Commenting);

  const iconColor = document.color ?? (first(colorPalette) as string);
  const childRef = React.useRef<HTMLDivElement>(null);
  const focusAtStart = React.useCallback(() => {
    if (ref.current) {
      ref.current.focusAtStart();
    }
  }, [ref]);

  React.useEffect(() => {
    if (focusedComment) {
      const viewingResolved = params.get("resolved") === "";
      if (
        (focusedComment.isResolved && !viewingResolved) ||
        (!focusedComment.isResolved && viewingResolved)
      ) {
        setFocusedCommentId(focusedComment.id);
      }
      ui.set({ commentsExpanded: true });
    }
  }, [focusedComment, ui, document.id, params]);

  // Save document when blurring title, but delay so that if clicking on a
  // button this is allowed to execute first.
  const handleBlur = React.useCallback(() => {
    setTimeout(() => props.onSave({ autosave: true }), 250);
  }, [props]);

  const handleGoToNextInput = React.useCallback(
    (insertParagraph: boolean) => {
      if (insertParagraph && ref.current) {
        const { view } = ref.current;
        const { dispatch, state } = view;
        dispatch(state.tr.insert(0, state.schema.nodes.paragraph.create()));
      }

      focusAtStart();
    },
    [focusAtStart, ref]
  );

  // Create a Comment model in local store when a comment mark is created, this
  // acts as a local draft before submission.
  const handleDraftComment = React.useCallback(
    (commentId: string, createdById: string) => {
      if (comments.get(commentId) || createdById !== user?.id) {
        return;
      }

      const comment = new Comment(
        {
          documentId: props.id,
          createdAt: new Date(),
          createdById,
          reactions: [],
        },
        comments
      );
      comment.id = commentId;
      comments.add(comment);
      setFocusedCommentId(commentId);
    },
    [comments, user?.id, props.id]
  );

  // Soft delete the Comment model when associated mark is totally removed.
  const handleRemoveComment = React.useCallback(
    async (commentId: string) => {
      const comment = comments.get(commentId);
      if (comment?.isNew) {
        await comment?.delete();
      }
    },
    [comments]
  );

  const {
    setEditor,
    setEditorInitialized,
    updateState: updateDocState,
  } = useDocumentContext();
  const handleRefChanged = React.useCallback(setEditor, [setEditor]);
  const EditorComponent = multiplayer ? MultiplayerEditor : Editor;

  const childOffsetHeight = childRef.current?.offsetHeight || 0;
  const editorStyle = React.useMemo(
    () => ({
      padding: "0 32px",
      margin: "0 -32px",
      paddingBottom: `calc(50vh - ${childOffsetHeight}px)`,
    }),
    [childOffsetHeight]
  );

  const handleInit = React.useCallback(
    () => setEditorInitialized(true),
    [setEditorInitialized]
  );

  const handleDestroy = React.useCallback(
    () => setEditorInitialized(false),
    [setEditorInitialized]
  );

  const direction = titleRef.current?.getComputedDirection();
  const isTortusPage = document.title?.toLowerCase().includes("tortus");

  return (
    <Flex auto column>
      {isTortusPage && (
        <>
          {/* OPTION 1: Hero Banner Style */}
          <OptionLabel>Option 1: Hero Banner</OptionLabel>
          <HeroBanner>
            <HeroImage
              src="https://via.placeholder.com/400x300?text=TORTUS"
              alt="TORTUS"
            />
            <HeroContent>
              <HeroTitle>TORTUS</HeroTitle>
              <HeroSubtitle>Clinical AI Assistant</HeroSubtitle>
              <HeroMeta>
                <MetaBadge status="live">🟢 Live</MetaBadge>
                <MetaItem>Founded 2022</MetaItem>
                <MetaItem>TORTUS Ltd</MetaItem>
              </HeroMeta>
              <HeroDescription>
                AI-powered clinical documentation assistant for healthcare
                professionals. Uses ambient voice technology to automate
                clinical documentation, allowing providers to focus on patient
                care.
              </HeroDescription>
              <HeroLinks>
                <HeroLinkButton
                  href="https://tortus.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  🌐 Website
                </HeroLinkButton>
                <HeroLinkButton
                  href="https://nhsaccelerator.com/innovations/tortus-ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  🏥 NHS Innovation
                </HeroLinkButton>
              </HeroLinks>
            </HeroContent>
          </HeroBanner>

          <Spacer />

          {/* OPTION 2: Card Grid Style */}
          <OptionLabel>Option 2: Card Grid</OptionLabel>
          <CardGridContainer>
            <CardGridImage
              src="https://via.placeholder.com/400x300?text=TORTUS"
              alt="TORTUS"
            />
            <CardGridTitle>TORTUS</CardGridTitle>
            <CardGridIntro>
              AI-powered clinical documentation assistant for healthcare
              professionals. Uses ambient voice technology and generative AI to
              automate clinical documentation, allowing healthcare providers to
              focus more on direct patient care.
            </CardGridIntro>
            <CardGrid>
              <Card>
                <CardIcon>🟢</CardIcon>
                <CardLabel>Status</CardLabel>
                <CardValue>Live</CardValue>
              </Card>
              <Card>
                <CardIcon>🏢</CardIcon>
                <CardLabel>Developer</CardLabel>
                <CardValue>TORTUS Ltd</CardValue>
              </Card>
              <Card>
                <CardIcon>📅</CardIcon>
                <CardLabel>Founded</CardLabel>
                <CardValue>2022</CardValue>
              </Card>
              <Card>
                <CardIcon>🤖</CardIcon>
                <CardLabel>AI Model</CardLabel>
                <CardValue>O.S.L.E.R.</CardValue>
              </Card>
              <Card>
                <CardIcon>🔓</CardIcon>
                <CardLabel>Open Source</CardLabel>
                <CardValue>No</CardValue>
              </Card>
              <Card>
                <CardIcon>💼</CardIcon>
                <CardLabel>Access</CardLabel>
                <CardValue>Commercial</CardValue>
              </Card>
            </CardGrid>
            <CardLinks>
              <CardLinkButton
                href="https://tortus.ai/"
                target="_blank"
                rel="noopener noreferrer"
              >
                🌐 Official Website
              </CardLinkButton>
              <CardLinkButton
                href="https://nhsaccelerator.com/innovations/tortus-ai/"
                target="_blank"
                rel="noopener noreferrer"
              >
                🏥 NHS Innovation Profile
              </CardLinkButton>
            </CardLinks>
          </CardGridContainer>

          <Spacer />
        </>
      )}
      <DocumentTitle
        ref={titleRef}
        readOnly={readOnly}
        documentId={document.id}
        title={
          !document.title && readOnly
            ? document.titleWithDefault
            : document.title
        }
        icon={document.icon}
        color={iconColor}
        onChangeTitle={onChangeTitle}
        onChangeIcon={onChangeIcon}
        onGoToNextInput={handleGoToNextInput}
        onBlur={handleBlur}
        placeholder={t("Untitled")}
      />
      {shareId ? (
        <>
          {document.title?.toLowerCase().includes("tortus") ? (
            <SharedMeta type="tertiary">
              <em>Reference test: hover over [1] to preview a source.</em>
            </SharedMeta>
          ) : null}
          {document.updatedAt ? (
            <SharedMeta type="tertiary">
              {t("Last updated")}{" "}
              <Time dateTime={document.updatedAt} addSuffix />
            </SharedMeta>
          ) : null}
        </>
      ) : (
        <DocumentMeta
          document={document}
          to={
            shareId
              ? undefined
              : {
                  pathname:
                    match.path === matchDocumentHistory
                      ? documentPath(document)
                      : documentHistoryPath(document),
                  state: { sidebarContext },
                }
          }
          rtl={direction === "rtl"}
        />
      )}
      <EditorComponent
        ref={mergeRefs([ref, handleRefChanged])}
        autoFocus={!!document.title && !props.defaultValue}
        placeholder={t("Type '/' to insert, or start writing…")}
        scrollTo={decodeURIComponentSafe(window.location.hash)}
        readOnly={readOnly}
        shareId={shareId}
        userId={user?.id}
        focusedCommentId={focusedComment?.id}
        onClickCommentMark={
          commentingEnabled && can.comment ? setFocusedCommentId : undefined
        }
        onCreateCommentMark={
          commentingEnabled && can.comment ? handleDraftComment : undefined
        }
        onDeleteCommentMark={
          commentingEnabled && can.comment ? handleRemoveComment : undefined
        }
        onInit={handleInit}
        onDestroy={handleDestroy}
        onChange={updateDocState}
        extensions={extensions}
        editorStyle={editorStyle}
        {...rest}
      />
      <div ref={childRef}>{children}</div>
    </Flex>
  );
}

const SharedMeta = styled(Text)`
  margin: -12px 0 2em 0;
  font-size: 14px;
`;

// Layout comparison styles
const OptionLabel = styled.div`
  background: ${(props) => props.theme.primary};
  color: white;
  padding: 0.5em 1em;
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 1em;
  border-radius: 4px;
`;

const Spacer = styled.div`
  height: 3em;
  border-bottom: 2px dashed ${(props) => props.theme.divider};
  margin: 2em 0;
`;

// OPTION 1: Hero Banner Styles
const HeroBanner = styled.div`
  display: flex;
  gap: 2em;
  padding: 2em;
  background: ${(props) => props.theme.backgroundSecondary};
  border: 1px solid ${(props) => props.theme.divider};
  border-radius: 8px;
  margin-bottom: 2em;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 1.5em;
  }
`;

const HeroImage = styled.img`
  width: 400px;
  height: 300px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 100%;
    height: 200px;
  }
`;

const HeroContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1em;
`;

const HeroTitle = styled.h2`
  margin: 0;
  font-size: 2em;
  font-weight: bold;
  color: ${(props) => props.theme.text};
`;

const HeroSubtitle = styled.div`
  font-size: 1.2em;
  color: ${(props) => props.theme.textSecondary};
  margin-top: -0.5em;
`;

const HeroMeta = styled.div`
  display: flex;
  gap: 1em;
  flex-wrap: wrap;
  align-items: center;
`;

const MetaBadge = styled.span<{ status?: string }>`
  background: ${(props) =>
    props.status === "live" ? "#10b981" : props.theme.primary};
  color: white;
  padding: 0.4em 0.8em;
  border-radius: 20px;
  font-size: 0.9em;
  font-weight: 600;
`;

const MetaItem = styled.span`
  color: ${(props) => props.theme.textTertiary};
  font-size: 0.95em;
`;

const HeroDescription = styled.p`
  color: ${(props) => props.theme.text};
  line-height: 1.6;
  margin: 0;
`;

const HeroLinks = styled.div`
  display: flex;
  gap: 1em;
  margin-top: auto;
  flex-wrap: wrap;
`;

const HeroLinkButton = styled.a`
  padding: 0.7em 1.5em;
  background: ${(props) => props.theme.primary};
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

// OPTION 2: Card Grid Styles
const CardGridContainer = styled.div`
  padding: 2em;
  background: ${(props) => props.theme.background};
  border: 1px solid ${(props) => props.theme.divider};
  border-radius: 8px;

  @media (max-width: 768px) {
    padding: 1.5em;
  }
`;

const CardGridImage = styled.img`
  width: 100%;
  max-width: 600px;
  height: 300px;
  object-fit: cover;
  border-radius: 8px;
  margin: 0 auto 2em;
  display: block;

  @media (max-width: 768px) {
    height: 200px;
  }
`;

const CardGridTitle = styled.h2`
  margin: 0 0 0.5em 0;
  font-size: 2.5em;
  font-weight: bold;
  color: ${(props) => props.theme.text};
  text-align: center;
`;

const CardGridIntro = styled.p`
  color: ${(props) => props.theme.textSecondary};
  line-height: 1.6;
  text-align: center;
  max-width: 800px;
  margin: 0 auto 2em;
  font-size: 1.1em;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5em;
  margin-bottom: 2em;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1em;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: ${(props) => props.theme.backgroundSecondary};
  border: 1px solid ${(props) => props.theme.divider};
  border-radius: 8px;
  padding: 1.5em;
  text-align: center;
  transition:
    transform 0.2s,
    box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const CardIcon = styled.div`
  font-size: 2em;
  margin-bottom: 0.5em;
`;

const CardLabel = styled.div`
  font-size: 0.85em;
  color: ${(props) => props.theme.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5em;
  font-weight: 600;
`;

const CardValue = styled.div`
  font-size: 1.1em;
  color: ${(props) => props.theme.text};
  font-weight: 600;
`;

const CardLinks = styled.div`
  display: flex;
  gap: 1em;
  justify-content: center;
  flex-wrap: wrap;
`;

const CardLinkButton = styled.a`
  padding: 1em 2em;
  background: ${(props) => props.theme.primary};
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 1em;
  transition: opacity 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5em;

  &:hover {
    opacity: 0.9;
  }
`;

export default observer(React.forwardRef(DocumentEditor));
