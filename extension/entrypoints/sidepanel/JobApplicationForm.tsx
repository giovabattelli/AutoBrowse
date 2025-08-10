import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { JobApplicationData, JobApplicationFormProps } from "@/types";

function JobApplicationForm({
  isOpen,
  onClose,
  onSubmit,
}: JobApplicationFormProps) {
  const [formData, setFormData] = useState<JobApplicationData>({
    firstName: "",
    lastName: "",
    preferredName: "",
    email: "",
    phoneNumber: "",
    aboutMe: "",
    school: "",
    startDate: "",
    expectedGraduation: "",
    currentLocation: "",
    currentCompany: "",
    linkedinUrl: "",
    githubUrl: "",
    websiteUrl: "",
    languages: "",
    hasOfferDeadlines: false,
    preferredStartDate: "",
    preferredLocations: ["", "", ""],
    isFinalInternship: false,
    requiresSponsorship: false,
    legallyAuthorizedToWork: false,
    veteranStatus: "prefer-not-to-answer",
    streetAddress: "",
    streetAddress2: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleLocationChange = (index: number, value: string) => {
    setFormData((prev) => {
      const newLocations = [...prev.preferredLocations];
      newLocations[index] = value;
      return {
        ...prev,
        preferredLocations: newLocations,
      };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      if (file.size > 8 * 1024 * 1024) {
        alert("File size must be less than 8MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setFormData((prev) => ({
          ...prev,
          resumeFile: base64,
          resumeFileName: file.name,
          resumeFileType: file.type,
        }));
      };
      reader.readAsDataURL(file);
    } else {
      alert("Please upload a PDF file");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Job Application Information</DialogTitle>
          <DialogDescription>
            Please provide your information to help the agent fill out job applications on your behalf.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Basic Information</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredName">Preferred Name</Label>
                <Input
                  id="preferredName"
                  name="preferredName"
                  value={formData.preferredName}
                  onChange={handleChange}
                  placeholder="Johnny"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john.doe@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  required
                />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Current Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentLocation">Current Location</Label>
                <Input
                  id="currentLocation"
                  name="currentLocation"
                  value={formData.currentLocation}
                  onChange={handleChange}
                  placeholder="San Francisco, CA"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentCompany">Current Company</Label>
                <Input
                  id="currentCompany"
                  name="currentCompany"
                  value={formData.currentCompany}
                  onChange={handleChange}
                  placeholder="ABC Corporation"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-sm">Address</h3>
            <div className="space-y-2">
              <Label htmlFor="streetAddress">Street Address</Label>
              <Input
                id="streetAddress"
                name="streetAddress"
                value={formData.streetAddress}
                onChange={handleChange}
                placeholder="123 Main Street"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="streetAddress2">Street Address 2 (Optional)</Label>
              <Input
                id="streetAddress2"
                name="streetAddress2"
                value={formData.streetAddress2}
                onChange={handleChange}
                placeholder="Apt 4B"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="San Francisco"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="CA"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder="94105"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="aboutMe">About Me</Label>
            <Textarea
              id="aboutMe"
              name="aboutMe"
              value={formData.aboutMe}
              onChange={handleChange}
              placeholder="Tell us about yourself, your experience, and career goals..."
              rows={3}
              required
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-sm">Professional Links</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                <Input
                  id="linkedinUrl"
                  name="linkedinUrl"
                  value={formData.linkedinUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/johndoe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="githubUrl">GitHub URL</Label>
                <Input
                  id="githubUrl"
                  name="githubUrl"
                  value={formData.githubUrl}
                  onChange={handleChange}
                  placeholder="https://github.com/johndoe"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL (Optional)</Label>
              <Input
                id="websiteUrl"
                name="websiteUrl"
                value={formData.websiteUrl}
                onChange={handleChange}
                placeholder="https://johndoe.com"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-sm">Resume</h3>
            <div className="space-y-2">
              <Label htmlFor="resume">Upload Resume (PDF, max 5MB)</Label>
              <Input
                id="resume"
                name="resume"
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
              />
              {formData.resumeFileName && (
                <p className="text-sm text-muted-foreground">
                  Uploaded: {formData.resumeFileName}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-sm">Education</h3>
            <div className="space-y-2">
              <Label htmlFor="school">School/University</Label>
              <Input
                id="school"
                name="school"
                value={formData.school}
                onChange={handleChange}
                placeholder="University of Example"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedGraduation">Expected Graduation</Label>
                <Input
                  id="expectedGraduation"
                  name="expectedGraduation"
                  type="date"
                  value={formData.expectedGraduation}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="languages">Languages</Label>
            <Input
              id="languages"
              name="languages"
              value={formData.languages}
              onChange={handleChange}
              placeholder="English, Spanish, Mandarin"
              required
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-sm">Job Preferences</h3>

            <div className="space-y-2">
              <Label htmlFor="preferredStartDate">Preferred Start Date (Month/Year)</Label>
              <Input
                id="preferredStartDate"
                name="preferredStartDate"
                value={formData.preferredStartDate}
                onChange={handleChange}
                placeholder="Month and year"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Preferred Locations (Up to 3)</Label>
              {[0, 1, 2].map((index) => (
                <Input
                  key={index}
                  value={formData.preferredLocations[index]}
                  onChange={(e) => handleLocationChange(index, e.target.value)}
                  placeholder={`Location ${index + 1} (e.g., New York, NY)`}
                  required={index === 0}
                />
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasOfferDeadlines"
                checked={formData.hasOfferDeadlines}
                onCheckedChange={(checked: boolean) =>
                  handleCheckboxChange("hasOfferDeadlines", checked)
                }
              />
              <Label htmlFor="hasOfferDeadlines" className="cursor-pointer">
                I have upcoming offer deadlines
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isFinalInternship"
                checked={formData.isFinalInternship}
                onCheckedChange={(checked: boolean) =>
                  handleCheckboxChange("isFinalInternship", checked)
                }
              />
              <Label htmlFor="isFinalInternship" className="cursor-pointer">
                This is my final internship before graduation
              </Label>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-sm">Legal Status</h3>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiresSponsorship"
                checked={formData.requiresSponsorship}
                onCheckedChange={(checked: boolean) =>
                  handleCheckboxChange("requiresSponsorship", checked)
                }
              />
              <Label htmlFor="requiresSponsorship" className="cursor-pointer">
                I require sponsorship
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="legallyAuthorizedToWork"
                checked={formData.legallyAuthorizedToWork}
                onCheckedChange={(checked: boolean) =>
                  handleCheckboxChange("legallyAuthorizedToWork", checked)
                }
              />
              <Label htmlFor="legallyAuthorizedToWork" className="cursor-pointer">
                I am legally authorized to work in the country where I'm applying
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="veteranStatus">Veteran Status</Label>
              <Select
                value={formData.veteranStatus}
                onValueChange={(value: string) => handleSelectChange("veteranStatus", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select veteran status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prefer-not-to-answer">Prefer not to answer</SelectItem>
                  <SelectItem value="not-veteran">I am not a veteran</SelectItem>
                  <SelectItem value="veteran">I am a veteran</SelectItem>
                  <SelectItem value="protected-veteran">I am a protected veteran</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Start Job Application Agent</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default JobApplicationForm;