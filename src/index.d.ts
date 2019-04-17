import { Component } from "react";
import { History } from "history";

export interface IScrollManagerProps {
    history: History;
    sessionKey?: string;
    timeout?: number;
}

export class ScrollManager extends Component<IScrollManagerProps> { }

export class WindowScroller extends Component { };

export interface IElementScrollerProps {
    scrollKey: string;
}

export class ElementScroller extends Component<IElementScrollerProps> { };
