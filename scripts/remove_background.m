#import <Foundation/Foundation.h>
#import <Vision/Vision.h>
#import <CoreImage/CoreImage.h>
#import <CoreGraphics/CoreGraphics.h>
#import <ImageIO/ImageIO.h>

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        NSString *inputPath = @"/Users/syagamreddybhanuprakashreddy/Desktop/shanmuka-fashions-site/assets/hero-model.jpg";
        NSString *outputPath = @"/Users/syagamreddybhanuprakashreddy/Desktop/shanmuka-fashions-site/assets/hero-model-transparent.png";
        
        NSURL *inputURL = [NSURL fileURLWithPath:inputPath];
        CIImage *inputImage = [CIImage imageWithContentsOfURL:inputURL];
        if (!inputImage) {
            NSLog(@"Failed to load input image: %@", inputPath);
            return 1;
        }
        
        CGRect extent = [inputImage extent];
        NSLog(@"Input image dimensions: %f x %f", extent.size.width, extent.size.height);
        
        VNGeneratePersonSegmentationRequest *request = [[VNGeneratePersonSegmentationRequest alloc] init];
        request.qualityLevel = VNGeneratePersonSegmentationRequestQualityLevelAccurate;
        request.outputPixelFormat = kCVPixelFormatType_OneComponent8;
        if (@available(macOS 12.0, *)) {
            request.usesCPUOnly = YES;
        }
        
        VNImageRequestHandler *handler = [[VNImageRequestHandler alloc] initWithCIImage:inputImage options:@{}];
        NSError *error = nil;
        BOOL success = [handler performRequests:@[request] error:&error];
        if (!success || error) {
            NSLog(@"Failed to perform Vision request: %@", error);
            return 1;
        }
        
        NSArray *results = request.results;
        if (!results || results.count == 0) {
            NSLog(@"No person detected in image!");
            return 1;
        }
        
        VNPixelBufferObservation *observation = results.firstObject;
        CVPixelBufferRef maskPixelBuffer = observation.pixelBuffer;
        CIImage *maskImage = [CIImage imageWithCVPixelBuffer:maskPixelBuffer];
        CGRect maskExtent = [maskImage extent];
        NSLog(@"Mask dimensions: %f x %f", maskExtent.size.width, maskExtent.size.height);
        
        // Scale mask to match original image dimensions
        CGFloat scaleX = extent.size.width / maskExtent.size.width;
        CGFloat scaleY = extent.size.height / maskExtent.size.height;
        CIImage *scaledMask = [maskImage imageByApplyingTransform:CGAffineTransformMakeScale(scaleX, scaleY)];
        
        // Blend with mask
        CIFilter *blendFilter = [CIFilter filterWithName:@"CIBlendWithMask"];
        [blendFilter setValue:inputImage forKey:@"inputImage"];
        [blendFilter setValue:[CIImage emptyImage] forKey:@"inputBackgroundImage"];
        [blendFilter setValue:scaledMask forKey:@"inputMaskImage"];
        
        CIImage *outputImage = [blendFilter outputImage];
        if (!outputImage) {
            NSLog(@"Blend filter produced nil outputImage");
            return 1;
        }
        
        CIContext *context = [CIContext contextWithOptions:@{
            kCIContextUseSoftwareRenderer: @(NO)
        }];
        
        CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
        NSURL *outputURL = [NSURL fileURLWithPath:outputPath];
        
        NSError *writeError = nil;
        BOOL writeSuccess = [context writePNGRepresentationOfImage:outputImage
                                                             toURL:outputURL
                                                            format:kCIFormatRGBA8
                                                        colorSpace:colorSpace
                                                           options:@{}
                                                             error:&writeError];
        CGColorSpaceRelease(colorSpace);
        
        if (!writeSuccess || writeError) {
            NSLog(@"Failed to write PNG: %@", writeError);
            return 1;
        }
        
        NSLog(@"Successfully generated transparent PNG at: %@", outputPath);
    }
    return 0;
}
