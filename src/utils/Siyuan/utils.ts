import { usePlugin } from '@/main';

const isNormalItem = (currentHintElement: HTMLElement, className: string) => {
  return currentHintElement.classList.contains("fn__none") || !currentHintElement.classList.contains(className);
};

export const upDownHint = (listElement: Element, event: KeyboardEvent, classActiveName = "b3-list-item--focus", defaultElement?: Element) => {
  let currentHintElement: HTMLElement = listElement.querySelector("." + classActiveName);
  if (!currentHintElement && defaultElement) {
      defaultElement.classList.add(classActiveName);
      defaultElement.scrollIntoView(true);
      return;
  }
  if (!currentHintElement) {
      return;
  }
  const className = classActiveName.split("--")[0];
  if (event.key === "ArrowDown") {
      event.preventDefault();
      event.stopPropagation();
      currentHintElement.classList.remove(classActiveName);

      currentHintElement = currentHintElement.nextElementSibling as HTMLElement;
      while (currentHintElement && isNormalItem(currentHintElement, className)) {
          currentHintElement = currentHintElement.nextElementSibling as HTMLElement;
      }

      if (!currentHintElement) {
          currentHintElement = listElement.children[0] as HTMLElement;
          while (currentHintElement && isNormalItem(currentHintElement, className)) {
              currentHintElement = currentHintElement.nextElementSibling as HTMLElement;
          }
      }
      if (!currentHintElement) {
          return;
      }
      currentHintElement.classList.add(classActiveName);
      if (listElement.scrollTop < currentHintElement.offsetTop - listElement.clientHeight + currentHintElement.clientHeight ||
          listElement.scrollTop > currentHintElement.offsetTop) {
          currentHintElement.scrollIntoView(listElement.scrollTop > currentHintElement.offsetTop);
      }
      return currentHintElement;
  } else if (event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      currentHintElement.classList.remove(classActiveName);

      currentHintElement = currentHintElement.previousElementSibling as HTMLElement;
      while (currentHintElement && isNormalItem(currentHintElement, className)) {
          currentHintElement = currentHintElement.previousElementSibling as HTMLElement;
      }

      if (!currentHintElement) {
          currentHintElement = listElement.children[listElement.children.length - 1] as HTMLElement;
          while (currentHintElement &&
          (currentHintElement.classList.contains("fn__none") || !currentHintElement.classList.contains(className))) {
              currentHintElement = currentHintElement.previousElementSibling as HTMLElement;
          }
      }
      if (!currentHintElement) {
          return;
      }
      currentHintElement.classList.add(classActiveName);

      const overTop = listElement.scrollTop > currentHintElement.offsetTop - (currentHintElement.previousElementSibling?.clientHeight || 0);
      if (listElement.scrollTop < currentHintElement.offsetTop - listElement.clientHeight + currentHintElement.clientHeight || overTop) {
          currentHintElement.scrollIntoView(overTop);
      }
      return currentHintElement;
  } else if (event.key === "Home") {
      event.preventDefault();
      event.stopPropagation();
      currentHintElement.classList.remove(classActiveName);
      currentHintElement = listElement.children[0] as HTMLElement;
      while (currentHintElement && isNormalItem(currentHintElement, className)) {
          currentHintElement = currentHintElement.nextElementSibling as HTMLElement;
      }
      if (!currentHintElement) {
          return;
      }
      currentHintElement.classList.add(classActiveName);
      currentHintElement.scrollIntoView();
      return currentHintElement;
  } else if (event.key === "End") {
      event.preventDefault();
      event.stopPropagation();
      currentHintElement.classList.remove(classActiveName);
      currentHintElement = listElement.children[listElement.children.length - 1] as HTMLElement;
      while (currentHintElement && isNormalItem(currentHintElement, className)) {
          currentHintElement = currentHintElement.previousElementSibling as HTMLElement;
      }
      if (!currentHintElement) {
          return;
      }
      currentHintElement.classList.add(classActiveName);
      currentHintElement.scrollIntoView(false);
      return currentHintElement;
  }
};


export const setPosition = (element: HTMLElement, x: number, y: number, targetHeight = 0, targetLeft = 0) => {
  const plugin = usePlugin()
  const SIZE_TOOLBAR_HEIGHT = plugin.isMobile ? 0 : 32
  element.style.top = y + "px";
  element.style.left = x + "px";
  const rect = element.getBoundingClientRect();
  // 上下超出屏幕
  if (rect.bottom > window.innerHeight || rect.top < SIZE_TOOLBAR_HEIGHT) {
      const top = y - rect.height - targetHeight;
      if (top > SIZE_TOOLBAR_HEIGHT && (top + rect.height) < window.innerHeight) {
          // 上部
          element.style.top = top + "px";
      } else if (top <= SIZE_TOOLBAR_HEIGHT) {
          // 位置超越到屏幕上方外时，需移动到屏幕顶部。eg：光标在第一个块，然后滚动到上方看不见的位置，按 ctrl+a
          element.style.top = SIZE_TOOLBAR_HEIGHT + "px";
      } else {
          // 依旧展现在下部，只是位置上移
          element.style.top = Math.max(SIZE_TOOLBAR_HEIGHT, window.innerHeight - rect.height) + "px";
      }
  }
  if (rect.right > window.innerWidth) {
      // 展现在左侧
      element.style.left = `${window.innerWidth - rect.width - targetLeft}px`;
  } else if (rect.left < 0) {
      // 依旧展现在左侧，只是位置右移
      element.style.left = "0";
  }
};

