var rimraf = require('rimraf');


rimraf('public/components',function(err) {
    if (err) {
        console.log(err);
        return;
    }

    console.log('removed bower components');
});

rimraf('node_modules',function(err) {
    if (err) {
        console.log(err);
        return;
    }

    console.log('removed node_modules');
});

