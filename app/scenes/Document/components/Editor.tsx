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

  // Force rebuild: timestamp 2025-10-01-20:00
  const isTortusPage = document.title?.toLowerCase().includes("tortus");

  return (
    <Flex auto column>
      {isTortusPage && (
        <InfoboxContainer>
          <InfoboxImage
            src="https://via.placeholder.com/300x200?text=TORTUS+Screenshot"
            alt="TORTUS"
          />
          <InfoboxTitle>TORTUS</InfoboxTitle>
          <InfoboxTable>
            <tbody>
              <InfoboxRow>
                <InfoboxLabel>Type:</InfoboxLabel>
                <InfoboxValue>Clinical AI Assistant</InfoboxValue>
              </InfoboxRow>
              <InfoboxRow>
                <InfoboxLabel>Developer:</InfoboxLabel>
                <InfoboxValue>TORTUS Ltd</InfoboxValue>
              </InfoboxRow>
              <InfoboxRow>
                <InfoboxLabel>Status:</InfoboxLabel>
                <InfoboxValue>🟢 Live</InfoboxValue>
              </InfoboxRow>
              <InfoboxRow>
                <InfoboxLabel>Founded:</InfoboxLabel>
                <InfoboxValue>2022</InfoboxValue>
              </InfoboxRow>
              <InfoboxRow>
                <InfoboxLabel>AI Model:</InfoboxLabel>
                <InfoboxValue>Proprietary LLM (O.S.L.E.R.)</InfoboxValue>
              </InfoboxRow>
              <InfoboxRow>
                <InfoboxLabel>Platform:</InfoboxLabel>
                <InfoboxValue>O.S.L.E.R.</InfoboxValue>
              </InfoboxRow>
              <InfoboxRow>
                <InfoboxLabel>Open Source:</InfoboxLabel>
                <InfoboxValue>No</InfoboxValue>
              </InfoboxRow>
              <InfoboxRow>
                <InfoboxLabel>Access:</InfoboxLabel>
                <InfoboxValue>Commercial</InfoboxValue>
              </InfoboxRow>
              <InfoboxRow>
                <InfoboxLabel>Primary Use:</InfoboxLabel>
                <InfoboxValue>Clinical documentation automation</InfoboxValue>
              </InfoboxRow>
              <InfoboxRow>
                <InfoboxLabel>Sector:</InfoboxLabel>
                <InfoboxValue>Healthcare</InfoboxValue>
              </InfoboxRow>
              <InfoboxRow>
                <InfoboxLabel>🔗 Links:</InfoboxLabel>
                <InfoboxValue>
                  <a
                    href="https://tortus.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Website
                  </a>
                  {" • "}
                  <a
                    href="https://nhsaccelerator.com/innovations/tortus-ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    NHS Innovation
                  </a>
                </InfoboxValue>
              </InfoboxRow>
            </tbody>
          </InfoboxTable>
        </InfoboxContainer>
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

const InfoboxContainer = styled.div`
  float: right;
  clear: right;
  width: 300px;
  margin: 0 0 1em 1em;
  padding: 0;
  border: 1px solid ${(props) => props.theme.divider};
  background-color: ${(props) => props.theme.backgroundSecondary};
  font-size: 14px;
  line-height: 1.5em;
  box-sizing: border-box;

  @media (max-width: 768px) {
    float: none;
    width: 100%;
    margin: 1em 0;
  }
`;

const InfoboxImage = styled.img`
  width: 100%;
  height: auto;
  display: block;
  border-bottom: 1px solid ${(props) => props.theme.divider};
`;

const InfoboxTitle = styled.div`
  padding: 0.5em;
  font-size: 1.2em;
  font-weight: bold;
  text-align: center;
  background-color: ${(props) => props.theme.primary}15;
  border-bottom: 1px solid ${(props) => props.theme.divider};
  color: ${(props) => props.theme.text};
`;

const InfoboxTable = styled.table`
  width: 100%;
  margin: 0;
  border: none;
  background: transparent;
  border-collapse: collapse;
  font-size: 13px;
`;

const InfoboxRow = styled.tr`
  vertical-align: top;

  &:not(:last-child) {
    border-bottom: 1px solid ${(props) => props.theme.divider}40;
  }
`;

const InfoboxLabel = styled.td`
  padding: 0.5em;
  font-weight: 600;
  text-align: left;
  width: 40%;
  color: ${(props) => props.theme.textTertiary};
  border: none;
`;

const InfoboxValue = styled.td`
  padding: 0.5em;
  text-align: left;
  border: none;
  color: ${(props) => props.theme.text};

  a {
    color: ${(props) => props.theme.link};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

export default observer(React.forwardRef(DocumentEditor));
