/*
 * Author: Zoltán Lajos Kis <zoltan.lajos.kis@ericsson.com>
 */

"use strict";

(function() {

var util = require('util');
var ofp = require('../../ofp.js');

var groupDescStats = require('../../structs/group-desc-stats.js');

var offsetsHeader = ofp.offsets.ofp_header;

module.exports = {
            "unpack" : function(buffer, offset) {
                    var stats = {
                            "header" : {"type" : 'OFPST_GROUP_DESC'},
                            "body" : {}
                        };
                    var warnings = [];

                    var len = buffer.readUInt16BE(offset + offsetsHeader.length, true);

                    if (len < ofp.sizes.ofp_stats_reply) {
                        return {
                            "error" : {
                                "desc" : util.format('%s stats message at offset %d has invalid length (%d).', stats.header.type, offset, len)
                            }
                        }
                    }

                    stats.body.stats = [];

                    var pos = offset + ofp.sizes.ofp_stats_reply;
                    while (pos < offset + len) {
                        var unpack = groupDescStats.unpack(buffer, pos);
                        if ('error' in unpack) {
                            return unpack;
                        }

                        if ('warnings' in unpack) {
                            warnings.concat(unpack.warnings);
                        }
                        stats.body.stats.push(unpack['group-desc-stats']);
                        pos = unpack.offset;
                    }

                    if (pos != offset + len) {
                        return {
                            "error" : {
                                "desc" : util.format('%s stats message at offset %d has extra bytes (%d).', stats.header.type, offset, (pos - len))
                            }
                        }
                    }

                    if (warnings.length = 0) {
                        return {
                            "stats" : stats,
                            "offset" : offset + len
                        }
                    } else {
                        return {
                            "stats" : stats,
                            "warnings" : warnings,
                            "offset" : offset + len
                        }
                    }
            },

            "pack" : function(stats, buffer, offset) {
                    var warnings = [];

                    if (buffer.length < offset + ofp.sizes.ofp_stats_reply) {
                        return {
                            error : { desc : util.format('%s statistics message at offset %d does not fit the buffer.', stats.header.type, offset)}
                        }
                    }

                    var pos = offset + ofp.sizes.ofp_stats_reply;

                    stats.body.stats.forEach(function(stat) {
                        var pack = groupDescStats.pack(stat, buffer, pos);

                        if ('error' in pack) {
                            return pack;
                        }
                        if ('warnings' in pack) {
                            warnings.concat(pack.warnings);
                        }
                        pos = pack.offset;
                    });


                    if (warnings.length == 0) {
                        return {
                            offset : pos
                        }
                    } else {
                        return {
                            warnings: warnings,
                            offset : pos
                        }
                    }
        }
}

})();
