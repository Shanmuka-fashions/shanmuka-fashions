ObjC.import('Foundation');
ObjC.import('CoreImage');
ObjC.import('Vision');
ObjC.import('AppKit');

var inputPath = "/Users/syagamreddybhanuprakashreddy/Desktop/shanmuka-fashions-site/assets/hero-model.jpg";
var outputPath = "/Users/syagamreddybhanuprakashreddy/Desktop/shanmuka-fashions-site/assets/hero-model-transparent.png";

var inputUrl = $.NSURL.fileURLWithPath(inputPath);
var inputImage = $.CIImage.imageWithContentsOfURL(inputUrl);

if (!inputImage || inputImage.isNil()) {
    console.log("Failed to load input image");
    $.exit(1);
}

var extent = inputImage.extent;
console.log("Input image size: " + extent.size.width + "x" + extent.size.height);

var request = $.VNGeneratePersonSegmentationRequest.alloc.init;
request.qualityLevel = 0; // Accurate

var handler = $.VNImageRequestHandler.alloc.initWithCIImageOptions(inputImage, $());
var error = Ref();
var success = handler.performRequestsError($([request]), error);

if (!success) {
    console.log("Failed to perform Vision request: " + error[0]);
    $.exit(1);
}

var results = request.results;
if (!results || results.count === 0) {
    console.log("No person detected");
    $.exit(1);
}

var observation = results.objectAtIndex(0);
var maskPixelBuffer = observation.pixelBuffer;
var maskImage = $.CIImage.imageWithCVPixelBuffer(maskPixelBuffer);

var maskExtent = maskImage.extent;
console.log("Mask size: " + maskExtent.size.width + "x" + maskExtent.size.height);

// Scale mask to original image size
var scaleX = extent.size.width / maskExtent.size.width;
var scaleY = extent.size.height / maskExtent.size.height;
var scaledMask = maskImage.imageByApplyingTransform($.CGAffineTransformMakeScale(scaleX, scaleY));

// Blend with mask:
// inputImage = foreground, inputBackgroundImage = transparent, inputMaskImage = mask
var blendFilter = $.CIFilter.filterWithName("CIBlendWithMask");
blendFilter.setValueForKey(inputImage, "inputImage");
blendFilter.setValueForKey(scaledMask, "inputMaskImage");

var emptyImage = $.CIImage.emptyImage;
blendFilter.setValueForKey(emptyImage, "inputBackgroundImage");

var outputImage = blendFilter.outputImage;

var context = $.CIContext.context;
var outputUrl = $.NSURL.fileURLWithPath(outputPath);
var colorSpace = $.CGColorSpaceCreateDeviceRGB();

var writeError = Ref();
var writeSuccess = context.writePNGRepresentationOfImageToURLFormatColorSpaceOptionsError(
    outputImage,
    outputUrl,
    $.kCIFormatRGBA8,
    colorSpace,
    $({}),
    writeError
);

if (writeSuccess) {
    console.log("Saved transparent PNG successfully to: " + outputPath);
} else {
    console.log("Failed to write PNG: " + writeError[0]);
}

