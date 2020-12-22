import React from 'react';
import { History } from 'history';

export interface ScrollManagerProps {
  history: History;
  sessionKey?: string;
  timeout?: number;
  // skippingSaveDeferredScroll?: boolean;
  blockSizeTolerance?: number;
}

export class ScrollManager extends React.Component<ScrollManagerProps> { }

export class WindowScroller extends React.Component { }

export interface ElementScrollerProps {
  scrollKey: string;
}

export class ElementScroller extends React.Component<ElementScrollerProps> { }
