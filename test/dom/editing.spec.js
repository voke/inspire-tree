'use strict';

describe('inline editing', function() {
    var $tree;
    var tree;

    before(function() {
        helpers.createTreeContainer();

        $tree = $('.tree');

        tree = new InspireTree({
            target: $tree,
            editable: true,
            data: [{
                text: 'A',
                id: 1,
                children: [{
                    text: 'B',
                    id: 2
                }, {
                    text: 'C',
                    id: 3
                }, {
                    text: 'D',
                    id: 4
                }]
            }]
        });
    });

    it('puts node into edit mode', function() {
        var node = tree.node(1);
        var $node = $(node.itree.ref);

        node.toggleEditing();

        expect(node.editing()).to.be.true;
        expect($node.find('form')).to.have.length(1);
        expect($node.find('button')).to.have.length(2);
    });

    it('saves changes', function() {
        var node = tree.node(1);
        var $node = $(node.itree.ref);

        $node.find('input')[0].value = 'Changed Node';

        // inferno doesn't work correctly with jQuery's .click
        $node.find('button')[0].click();

        expect(node.text).to.equal('Changed Node');
    });

    it('disables edit mode', function() {
        expect(tree.node(1).editing()).to.be.false;
    });

    it('removes a node', function(done) {
        setTimeout(function() {
            expect($tree.find('li')).to.have.length(5);

            var $node = $(tree.node(2).itree.ref);

            // inferno doesn't work correctly with jQuery's .click
            $node.find('.icon-minus')[0].click();

            expect($tree.find('li')).to.have.length(4);

            done();
        });
    });

    // Note: doing this better tests that we're not just removing from the end
    it('removes a second node', function() {
        setTimeout(function() {
            expect($tree.find('li')).to.have.length(4);

            var $node = $(tree.node(3).itree.ref);

            // inferno doesn't work correctly with jQuery's .click
            $node.find('.icon-minus')[0].click();
            expect($tree.find('li')).to.have.length(3);

            expect($tree.find('li:eq(1) a').text()).to.equal('D');
        });
    });

    after(helpers.clearDOM);
});
