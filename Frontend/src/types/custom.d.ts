declare module 'lodash' {
    export function debounce<T extends (...args: any[]) => any>(
        func: T,
        wait?: number,
        options?: {
            leading?: boolean;
            maxWait?: number;
            trailing?: boolean;
        }
    ): T & { cancel: () => void; flush: () => void };
}

declare module 'react-infinite-scroll-component' {
    import { ComponentType, ReactNode } from 'react';

    interface InfiniteScrollProps {
        dataLength: number;
        next: () => void;
        hasMore: boolean;
        loader?: ReactNode;
        endMessage?: ReactNode;
        scrollThreshold?: number | string;
        scrollableTarget?: string;
        style?: React.CSSProperties;
        height?: number | string;
        scrollableTarget?: string;
        hasChildren?: boolean;
        pullDownToRefresh?: boolean;
        pullDownToRefreshContent?: ReactNode;
        releaseToRefreshContent?: ReactNode;
        pullDownToRefreshThreshold?: number;
        refreshFunction?: () => void;
        initialScrollY?: number;
        key?: string | number;
    }

    const InfiniteScroll: ComponentType<InfiniteScrollProps>;
    export default InfiniteScroll;
} 