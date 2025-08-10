from typing import Dict, List, Optional, Union
from .models import PageDom, ElementNode, TextNode


NodeMap = Dict[str, Union[ElementNode, TextNode]]
ParentMap = Dict[str, str]
DEFAULT_ATTRS: List[str] = [
    "title",
    "type",
    "checked",
    "name",
    "role",
    "value",
    "placeholder",
    "data-date-format",
    "alt",
    "aria-label",
    "aria-expanded",
    "data-state",
    "aria-checked",
]


def build_interactive_dom(
    dom: PageDom,
    *,
    include_attrs: Optional[List[str]] = None,
    indent_token: str = "\t",
) -> str:
    if include_attrs is None:
        include_attrs = DEFAULT_ATTRS

    node_map: NodeMap = dom.map
    parent_of: ParentMap = build_parent_lookup(node_map)

    clickable_count = sum(
        1
        for node in node_map.values()
        if isinstance(node, ElementNode) and node.highlightIndex is not None
    )
    contextual_count = sum(
        1
        for node in node_map.values()
        if isinstance(node, ElementNode)
        and node.highlightIndex is None
        and should_include_for_context(node)
    )

    print(
        f"\n[DOM] Total nodes: {len(node_map)}, Clickable elements: {clickable_count}, "
        f"Contextual elements: {contextual_count}"
    )

    lines: List[str] = []
    depth_first_render(
        node_id=dom.rootId,
        depth=0,
        node_map=node_map,
        parent_of=parent_of,
        include_attrs=include_attrs,
        indent_token=indent_token,
        sink=lines,
    )
    return "\n".join(lines)


def build_parent_lookup(node_map: NodeMap) -> ParentMap:
    parents: ParentMap = {}
    for node_id, node in node_map.items():
        if isinstance(node, ElementNode):
            for child_id in node.children:
                parents[child_id] = node_id
    return parents


def node_has_highlight_ancestor(
    node_id: str, node_map: NodeMap, parent_of: ParentMap
) -> bool:
    parent_id = parent_of.get(node_id)
    while parent_id:
        parent = node_map[parent_id]
        if isinstance(parent, ElementNode) and parent.highlightIndex is not None:
            return True
        parent_id = parent_of.get(parent_id)
    return False


def should_include_for_context(node: ElementNode) -> bool:
    # Commenting out contextual elements to reduce DOM noise
    # if node.tagName.lower() == "form":
    #     return True
    # if node.tagName.lower() in ["h1", "h2", "h3", "h4", "h5", "h6"]:
    #     return True

    # classes = node.attributes.get("class", "").lower()
    # if any(cls in classes for cls in ["error", "success", "warning", "alert"]):
    #     return True

    # if node.attributes.get("role") == "dialog" or node.attributes.get("aria-modal"):
    #     return True

    return False


def collect_text_until_next_highlight(start_id: str, node_map: NodeMap) -> str:
    text_buffer: List[str] = []

    def walk(node_id: str) -> None:
        node = node_map[node_id]
        if isinstance(node, TextNode):
            text = node.text.strip()
            if text:
                text_buffer.append(text)
        elif isinstance(node, ElementNode):
            for child_id in node.children:
                walk(child_id)

    walk(start_id)
    return " ".join(text_buffer)


def depth_first_render(
    node_id: str,
    *,
    depth: int,
    node_map: NodeMap,
    parent_of: ParentMap,
    include_attrs: List[str],
    indent_token: str,
    sink: List[str],
) -> None:
    node = node_map[node_id]
    indent = indent_token * depth

    if isinstance(node, ElementNode):
        clickable = node.highlightIndex is not None
        contextual = should_include_for_context(node)
        should_render = clickable or contextual
        next_depth = depth + 1 if should_render else depth

        if should_render:
            text = collect_text_until_next_highlight(node_id, node_map)
            attrs_html = format_attributes(node, include_attrs)
            display_text = f"> {text}" if text else ""

            if clickable:
                sink.append(
                    f"{indent}[{node.highlightIndex}]<{node.tagName}{attrs_html} "
                    f"{display_text} />"
                )
            else:
                sink.append(f"{indent}<{node.tagName}{attrs_html} {display_text} />")

        for child_id in node.children:
            depth_first_render(
                node_id=child_id,
                depth=next_depth,
                node_map=node_map,
                parent_of=parent_of,
                include_attrs=include_attrs,
                indent_token=indent_token,
                sink=sink,
            )
    else:
        if node_has_highlight_ancestor(node_id, node_map, parent_of):
            return

        parent_id = parent_of.get(node_id)
        parent = node_map.get(parent_id) if parent_id else None

        if isinstance(parent, ElementNode):
            if parent.isVisible and parent.isTopElement:
                sink.append(f"{indent}{node.text}")


def format_attributes(element: ElementNode, include_attrs: List[str]) -> str:
    attrs = {
        key: value.strip()
        for key, value in element.attributes.items()
        if key in include_attrs and value.strip()
    }

    if element.isInteractive is not None:
        attrs["data-interactive"] = str(element.isInteractive).lower()
    if element.isInViewport is not None:
        attrs["data-in-viewport"] = str(element.isInViewport).lower()
    if element.isTopElement is not None:
        attrs["data-top-element"] = str(element.isTopElement).lower()

    return (
        " " + " ".join(f"{key}={value!r}" for key, value in attrs.items())
        if attrs
        else ""
    )
