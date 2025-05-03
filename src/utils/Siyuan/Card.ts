import { Constants, IProtyle } from 'siyuan'

export const quickMakeCard = (protyle: IProtyle, nodeElement: Element[]) => {
  let isRemove = true;
  const protyleInstance = protyle.getInstance();
  const ids: string[] = [];
  nodeElement.forEach(item => {
      if (item.getAttribute("data-type") === "NodeThematicBreak") {
          return;
      }
      item.classList.remove("protyle-wysiwyg--select");
      ids.push(item.getAttribute("data-node-id"));
      if ((item.getAttribute(Constants.CUSTOM_RIFF_DECKS) || "").indexOf(Constants.QUICK_DECK_ID) === -1) {
          isRemove = false;
      }
  });
  if (isRemove) {
    protyleInstance.transaction([{
          action: "removeFlashcards",
          deckID: Constants.QUICK_DECK_ID,
          blockIDs: ids
      }], [{
          action: "addFlashcards",
          deckID: Constants.QUICK_DECK_ID,
          blockIDs: ids
      }]);
  } else {
    protyleInstance.transaction([{
          action: "addFlashcards",
          deckID: Constants.QUICK_DECK_ID,
          blockIDs: ids
      }], [{
          action: "removeFlashcards",
          deckID: Constants.QUICK_DECK_ID,
          blockIDs: ids
      }]);
  }
};