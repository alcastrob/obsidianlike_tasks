"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LinkResolver_1 = require("../../src/Task/LinkResolver");
const Link_1 = require("../../src/Task/Link");
const MockDataLoader_1 = require("../TestingTools/MockDataLoader");
describe('LinkResolver', () => {
    let rawLink;
    const link_in_file_body = MockDataLoader_1.MockDataLoader.get('link_in_file_body');
    beforeEach(() => {
        rawLink = link_in_file_body.cachedMetadata.links[0];
    });
    it('should resolve a link via local instance', () => {
        const link = new Link_1.Link(rawLink, link_in_file_body.filePath);
        expect(link.originalMarkdown).toEqual('[[yaml_tags_is_empty]]');
        expect(link.destinationPath).toBeNull();
    });
    it('should resolve a link via global instance', () => {
        const link = new Link_1.Link(rawLink, link_in_file_body.filePath);
        expect(link.originalMarkdown).toEqual('[[yaml_tags_is_empty]]');
        expect(link.destinationPath).toBeNull();
    });
    it('should allow a function to be supplied, to find the destination of a link', () => {
        const resolver = LinkResolver_1.LinkResolver.getInstance();
        resolver.setGetFirstLinkpathDestFn(() => 'Hello World.md');
        const link = new Link_1.Link(rawLink, link_in_file_body.filePath);
        expect(link.destinationPath).toEqual('Hello World.md');
    });
    it('should allow the global instance to be reset', () => {
        const globalInstance = LinkResolver_1.LinkResolver.getInstance();
        globalInstance.setGetFirstLinkpathDestFn(() => 'From Global Instance.md');
        const link1 = new Link_1.Link(rawLink, link_in_file_body.filePath);
        expect(link1.destinationPath).toEqual('From Global Instance.md');
        globalInstance.resetGetFirstLinkpathDestFn();
        const link2 = new Link_1.Link(rawLink, link_in_file_body.filePath);
        expect(link2.destinationPath).toBeNull();
    });
    it('resetting global instance affects pre-existing links', () => {
        const globalInstance = LinkResolver_1.LinkResolver.getInstance();
        globalInstance.setGetFirstLinkpathDestFn(() => 'From Global Instance.md');
        const link1 = new Link_1.Link(rawLink, link_in_file_body.filePath);
        expect(link1.destinationPath).toEqual('From Global Instance.md');
        globalInstance.resetGetFirstLinkpathDestFn();
        expect(link1.destinationPath).toBeNull();
    });
});
//# sourceMappingURL=LinkResolver.test.js.map