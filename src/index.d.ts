import React from 'react';
import { History } from 'history';

export interface ScrollManagerProps {
  history: History;
  sessionKey?: string;
  timeout?: number;
}

export class ScrollManager extends React.Component<
  React.PropsWithChildren<ScrollManagerProps>
> {}

export class WindowScroller extends React.Component<
  React.PropsWithChildren<{}>
> {}

export interface ElementScrollerProps {
  scrollKey: string;
}

export class ElementScroller extends React.Component<
  React.PropsWithChildren<ElementScrollerProps>
> {}
