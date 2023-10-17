# [galaxy-brain](https://tinnywang.github.io/galaxy-brain/)

https://github.com/tinnywang/galaxy-brain/assets/1168893/4a2f1cad-32c9-45b4-b39f-f40dc8dafc6d

## About
This project is a WebGL homage to the [galaxy brain](https://memepediadankmemes.fandom.com/wiki/Expanding_Brain) meme.

As I was examining the galaxy brain meme template one day, it occurred to me that each of the images in the template featured interesting lighting phenomena.
I wondered how I might recreate these visual effects with computer graphics and, thus, this project was born.

For best results, view in a browser with hardware acceleration enabled on a computer with a GPU.

## Resources
I implemented many of the visual effects by following the techniques described in the following writings.
- [Order-independent transparency](https://my.eng.utah.edu/~cs5610/handouts/order_independent_transparency.pdf)
- [FXAA](https://developer.download.nvidia.com/assets/gamedev/files/sdk/11/FXAA_WhitePaper.pdf)
- [Volumetric lighting](https://developer.nvidia.com/gpugems/gpugems3/part-ii-light-and-shadows/chapter-13-volumetric-light-scattering-post-process) AKA crepuscular rays
- [Fresnel effect](https://ameye.dev/notes/rendering-outlines/)
- More [fresnel effect](https://www.ronja-tutorials.com/post/012-fresnel/)
- [GLSL hue shift function](https://gist.github.com/mairod/a75e7b44f68110e1576d77419d608786?permalink_comment_id=3195243#gistcomment-3195243)

The binary rain in the 4th stage of the meme is courtesy of [@ojdom/matrix-rain](https://www.npmjs.com/package/@ojdom/matrix-rain).

## Assets
I did not make the 3D models or the lens flare textures featured in this project.
I slightly modified some of the models in Blender to reduce the polycount or extract certain parts, but links to the orignals can be found below.
- [Head](https://www.cgtrader.com/free-3d-models/character/man/human-man-head-demo)
- [Brain](https://www.cgtrader.com/free-3d-models/science/medical/brain-model-1feece89-ae17-4490-9119-817fa6e7518a)
- [Skull](https://www.cgtrader.com/free-3d-models/character/anatomy/free-skull-teeth-and-jaw-3d-model)
- [Spine](https://www.cgtrader.com/free-3d-models/character/man/backbone)
- [Lens flares](https://www.vecteezy.com/vector-art/17204278-lens-flares-pack-photoshop-realistic-light-free)

## TODO
- [ ] Redraw the scene properly (instead of reloading the page) when the window resizes.
- [ ] Scale brain neurons and laser beam stars when the camera zooms in/out.
- [ ] Add settings for toggling lighting effects, anti-aliasing, etc.
- [ ] Add keyboard controls for rotating and zooming the camera.
- [ ] Add support for automatic scene rotation.
