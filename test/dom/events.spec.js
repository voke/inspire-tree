'use strict';

describe('DOM-related events', function() {
    var $tree;
    var tree;

    before(function() {
        helpers.createTreeContainer();

        $tree = $('.tree');

        tree = new InspireTree({
            target: $tree,
            data: [{
                text: 'A'
            }, {
                text: 'B',
                children: [{
                    text: 'B1'
                }]
            }]
        });
    });

    it('provides a preventTreeDefault method', function(done) {
        tree.on('node.click', function(event) {
            expect(event.preventTreeDefault).to.be.a('function');
            done();
        });

        // inferno doesn't work correctly with jQuery's .click
        $tree.find('a.title')[0].click();
    });

    it('passes handler as an argument', function(done) {
        tree.on('node.click', function(event, node, handler) {
            expect(handler).to.be.a('function');
            done();
        });

        // inferno doesn't work correctly with jQuery's .click
        $tree.find('a.title')[0].click();
    });

    after(helpers.clearDOM);
});
