import { Constants, IProtyle } from 'siyuan'

// 检查块是否已经制过卡
export const isBlockCarded = (nodeElement: Element): boolean => {
  if (!nodeElement) return false
  const customRiffDecks = nodeElement.getAttribute(Constants.CUSTOM_RIFF_DECKS) || ""
  return customRiffDecks.indexOf(Constants.QUICK_DECK_ID) !== -1
}

// 取消制卡
export const removeCard = (protyle: IProtyle, nodeElement: Element[]) => {
  const protyleInstance = protyle.getInstance()
  const ids: string[] = []

  nodeElement.forEach(item => {
    if (item.getAttribute("data-type") === "NodeThematicBreak") {
      return
    }
    item.classList.remove("protyle-wysiwyg--select")
    ids.push(item.getAttribute("data-node-id"))
  })

  if (ids.length > 0) {
    protyleInstance.transaction([{
      action: "removeFlashcards",
      deckID: Constants.QUICK_DECK_ID,
      blockIDs: ids
    }], [{
      action: "addFlashcards",
      deckID: Constants.QUICK_DECK_ID,
      blockIDs: ids
    }])
  }
}

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
